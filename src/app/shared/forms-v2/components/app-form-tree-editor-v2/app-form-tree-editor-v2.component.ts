import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Host,
  Input,
  OnDestroy,
  Optional,
  Output,
  SkipSelf,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { ITreeEditorDataCategory, ITreeEditorDataCategoryItem } from './models/tree-editor.model';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { v4 as uuid } from 'uuid';
import {
  ICreateViewModifyV2TabTableTreeAddNewItem
} from '../../../components-v2/app-create-view-modify-v2/models/tab.model';

/**
 * Flatten type
 */
enum FlattenType {
  CATEGORY,
  CATEGORY_ITEM,
  INFO
}

/**
 * Flatten node - info
 */
interface IFlattenNodeInfo {
  // required
  type: FlattenType.INFO;
  text: string;
  parent: IFlattenNodeCategory;
  data: {
    id: string
  };
}

/**
 * Flatten node - category item
 */
interface IFlattenNodeCategoryItem {
  // required
  type: FlattenType.CATEGORY_ITEM;
  parent: IFlattenNodeCategory;
  data: ITreeEditorDataCategoryItem;
}

/**
 * Cause why item is visible after filter
 */
enum VisibleCause {
  SEARCH = 1,
  CHILD = 2
}

/**
 * Flatten node - category
 */
interface IFlattenNodeCategory {
  // required
  type: FlattenType.CATEGORY;
  text: string;
  data: ITreeEditorDataCategory;
}

@Component({
  selector: 'app-form-tree-editor-v2',
  templateUrl: './app-form-tree-editor-v2.component.html',
  styleUrls: ['./app-form-tree-editor-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormTreeEditorV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppFormTreeEditorV2Component
  extends AppFormBaseV2<ITreeEditorDataCategory[]> implements OnDestroy {

  // viewport
  @ViewChild('cdkViewport') cdkViewport: CdkVirtualScrollViewport;

  // selected tab change
  // - hack fix for virtual scroll problem
  @Input() set selectedTab(selected: boolean) {
    if (
      selected &&
      this.cdkViewport
    ) {
      this.cdkViewport.scrollToIndex(0);
      this.cdkViewport.checkViewportSize();
    }
  }

  // view only
  @Input() viewOnly: boolean;

  @Output() addNewItem: EventEmitter<ICreateViewModifyV2TabTableTreeAddNewItem> = new EventEmitter<ICreateViewModifyV2TabTableTreeAddNewItem>();

  // language handler
  private _languageSubscription: Subscription;

  // flattened data
  private _allFlattenedCategories: (IFlattenNodeCategory | IFlattenNodeCategoryItem | IFlattenNodeInfo)[] = [];
  flattenedCategories: (IFlattenNodeCategory | IFlattenNodeCategoryItem | IFlattenNodeInfo)[] = [];

  // filter
  searchValue: string;

  // copy checkbox value on drag
  copyCheckbox: boolean;

  // timers
  private _startCopyTimer: any;

  // constants
  FlattenType = FlattenType;

  // arrow callbacks
  copyCheckboxMouseUpArrow: () => void = () => {
    this.copyCheckboxMouseUp();
  };

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // parent
    super(
      controlContainer,
      i18nService,
      changeDetectorRef
    );

    // subscribe to language change
    this.initializeLanguageChangeListener();

    // attach events
    document.addEventListener(
      'mouseup',
      this.copyCheckboxMouseUpArrow
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // stop copy timer
    this.stopStartCopyTimer();

    // remove events
    document.removeEventListener(
      'mouseup',
      this.copyCheckboxMouseUpArrow
    );
  }

  /**
   * Write value and construct questionnaire
   */
  writeValue(value: ITreeEditorDataCategory[]): void {
    // // initialize value if necessary
    if (!value) {
      value = [];
    }

    // set value
    super.writeValue(value);

    // sort values
    this.sortValues();

    // flatten
    // - detect changes is triggered by this.nonFlatToFlat function
    this.nonFlatToFlat();
  }

  /**
   * Re-render UI
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // attach event
    this._languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // sort values using the new translations
        this.sortValues();

        // redraw
        // - detect changes is triggered by this.nonFlatToFlat function
        this.nonFlatToFlat();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this._languageSubscription) {
      this._languageSubscription.unsubscribe();
      this._languageSubscription = null;
    }
  }

  /**
   * Sort categories and their items
   */
  private sortValues(): void {
    // nothing to do ?
    if (!this.value?.length) {
      return;
    }

    // sort categories
    this.value.sort((c1, c2): number => {
      return (c1.label ? this.i18nService.instant(c1.label) : '').localeCompare(c2.label ? this.i18nService.instant(c2.label) : '');
    });

    // sort categories items
    this.value.forEach((category) => {
      // nothing to do ?
      if (!category.children.options?.length) {
        return;
      }

      // sort
      category.children.options.sort((i1, i2): number => {
        return (i1.label ? this.i18nService.instant(i1.label) : '').localeCompare(i2.label ? this.i18nService.instant(i2.label) : '');
      });
    });
  }

  /**
   * Convert non flat value to flat value
   */
  private nonFlatToFlat(): void {
    // flatten
    this.flatten();

    // update visible
    // - detect changes is triggered by this.filter function
    this.filter(this.searchValue);
  }

  /**
   * Flatten
   */
  private flatten(): void {
    // reset
    this._allFlattenedCategories = [];

    // nothing to do ?
    if (!this.value?.length) {
      return;
    }

    // go through categories
    this.value.forEach((category) => {
      // add category
      const categoryNode: IFlattenNodeCategory = {
        type: FlattenType.CATEGORY,
        text: category.label ?
          this.i18nService.instant(category.label) :
          '—',
        data: category
      };
      this._allFlattenedCategories.push(categoryNode);

      // push items
      category.checked = 0;
      category.children?.options?.forEach((item) => {
        // if view only - display only selected
        if (
          this.viewOnly &&
          !category.children.selected[item.id]
        ) {
          return;
        }

        // count checked
        if (category.children.selected[item.id]) {
          category.checked++;
        }

        // add item
        this._allFlattenedCategories.push({
          type: FlattenType.CATEGORY_ITEM,
          parent: categoryNode,
          data: item
        });
      });

      // add info
      if (
        this.viewOnly &&
        category.checked < 1
      ) {
        this._allFlattenedCategories.push({
          type: FlattenType.INFO,
          text: this.i18nService.instant('LNG_COMMON_LABEL_NOTHING_SELECTED'),
          parent: categoryNode,
          data: {
            id: uuid()
          }
        });
      }
    });
  }

  /**
   * Filter
   */
  filter(searchValue: string): void {
    // update filter value
    this.searchValue = searchValue;

    // nothing to filter ?
    if (!this._allFlattenedCategories?.length) {
      // empty list
      this.flattenedCategories = [];

      // update ui
      this.detectChanges();

      // finished
      return;
    }

    // case insensitive
    const byValue: string = (this.searchValue || '').toLowerCase();

    // filter
    // - we need to determine first all filtered items to be able to show category if one of its children is visible
    const visibleIds: {
      [id: string]: VisibleCause
    } = {};
    this._allFlattenedCategories.forEach((item): void => {
      if (
        (
          item.type === FlattenType.CATEGORY ||
          !item.parent.data.collapsed
        ) && (
          !byValue ||
          (
            item.type === FlattenType.CATEGORY &&
            item.text.toLowerCase().indexOf(byValue) > -1
          ) || (
            item.type === FlattenType.CATEGORY_ITEM && (
              visibleIds[item.parent.data.id] === VisibleCause.SEARCH || (
                item.data.label &&
                this.i18nService.instant(item.data.label) &&
                this.i18nService.instant(item.data.label).toLowerCase().indexOf(byValue) > -1
              )
            )
          ) || (
            item.type === FlattenType.INFO && (
              visibleIds[item.parent.data.id] === VisibleCause.SEARCH ||
              item.text.toLowerCase().indexOf(byValue) > -1
            )
          )
        )
      ) {
        // make item visible
        visibleIds[item.data.id] = VisibleCause.SEARCH;

        // make parent visible if necessary
        if (
          (
            item.type === FlattenType.CATEGORY_ITEM ||
            item.type === FlattenType.INFO
          ) &&
          !visibleIds[item.parent.data.id]
        ) {
          visibleIds[item.parent.data.id] = VisibleCause.CHILD;
        }
      }
    });

    // filter
    this.flattenedCategories = this._allFlattenedCategories.filter((item): boolean => !!visibleIds[item.data.id]);

    // update ui
    this.detectChanges();
  }

  /**
   * Expand collapse
   */
  expandCollapse(item: IFlattenNodeCategory): void {
    // expand / collapse
    if (item.data.collapsed) {
      delete item.data.collapsed;
    } else {
      item.data.collapsed = true;
    }

    // redraw
    // - detect changes is triggered by this.nonFlatToFlat function
    this.nonFlatToFlat();
  }

  /**
   * Selected item changed
   */
  selectedChanged(item: IFlattenNodeCategoryItem): void {
    // reset value
    item.parent.data.checked = 0;
    item.parent.data.children.options.forEach((option) => {
      // not selected ?
      if (!item.parent.data.children.selected[option.id]) {
        return;
      }

      // count
      item.parent.data.checked++;
    });

    // trigger on change
    this.onChange(this.value);

    // mark dirty
    this.control?.markAsDirty();

    // update ui
    this.detectChanges();
  }

  /**
   * Add item
   */
  add(category: IFlattenNodeCategory): void {
    this.addNewItem.emit({
      category: category.data,
      finish: (item) => {
        // something went wrong ?
        if (!item?.id) {
          return;
        }

        // append item
        category.data.children.options.push(item);

        // select it, otherwise why did we add it ?
        category.data.children.selected[item.id] = true;

        // sort values using the new translations
        this.sortValues();

        // redraw
        // - detect changes is triggered by this.nonFlatToFlat function
        this.nonFlatToFlat();
      }
    });
  }

  /**
   * Stop copy timer
   */
  stopStartCopyTimer(): void {
    if (this._startCopyTimer) {
      clearTimeout(this._startCopyTimer);
      this._startCopyTimer = undefined;
    }
  }

  /**
   * Copy value from one checkbox to others - mouse down
   */
  copyCheckboxMouseDown(
    event,
    item: IFlattenNodeCategoryItem
  ): void {
    // no point in continuing if mouse not down
    // - or option is disabled
    if (
      event.buttons !== 1 ||
      item.data.disabled
    ) {
      return;
    }

    // stop copy timer
    this.stopStartCopyTimer();

    // start copy timer
    this._startCopyTimer = setTimeout(() => {
      // reset
      this._startCopyTimer = undefined;

      // set copy value
      this.copyCheckbox = !!item.parent.data.children.selected[item.data.id];

      // update ui
      this.detectChanges();
    }, 300);
  }

  /**
   * Copy value from one checkbox to others - mouse leave
   */
  copyCheckboxMouseLeave(): void {
    // stop copy if we didn't wait for it to start
    if (this.copyCheckbox === undefined) {
      // stop copy timer
      this.stopStartCopyTimer();
    }
  }

  /**
   * Copy value from one checkbox to others - mouse up
   */
  copyCheckboxMouseUp(): void {
    // stop copy timer
    this.stopStartCopyTimer();

    // nothing to do ?
    if (this.copyCheckbox === undefined) {
      return;
    }

    // reset
    this.copyCheckbox = undefined;

    // update ui
    this.detectChanges();
  }

  /**
   * Copy value from one checkbox to others - mouse enter
   */
  copyCheckboxMouseEnter(
    event: MouseEvent,
    item: IFlattenNodeCategoryItem
  ): void {
    // no point in continuing if mouse not down
    // - or option is disabled
    if (
      event.buttons !== 1 ||
      item.data.disabled ||
      this.copyCheckbox === undefined
    ) {
      return;
    }

    // copy value
    if (this.copyCheckbox) {
      item.parent.data.children.selected[item.data.id] = true;
    } else {
      delete item.parent.data.children.selected[item.data.id];
    }

    // update
    this.selectedChanged(item);
  }
}
