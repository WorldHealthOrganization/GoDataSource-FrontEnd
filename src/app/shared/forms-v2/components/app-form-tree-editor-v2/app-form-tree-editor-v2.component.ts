import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Host, HostListener,
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
import { ITreeEditorDataCategory, ITreeEditorDataCategoryItem, ITreeEditorDataValue } from './models/tree-editor.model';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { v4 as uuid } from 'uuid';
import {
  ICreateViewModifyV2TabTableTreeAddNewItem
} from '../../../components-v2/app-create-view-modify-v2/models/tab.model';
import { determineIfSmallScreenMode } from '../../../../core/methods/small-screen-mode';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

/**
 * Flatten type
 */
enum FlattenType {
  CATEGORY,
  CATEGORY_COLUMNS,
  CATEGORY_ITEM,
  INFO
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
 * Flatten node - category columns
 */
interface IFlattenNodeCategoryColumns {
  // required
  type: FlattenType.CATEGORY_COLUMNS;
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
  extends AppFormBaseV2<ITreeEditorDataValue> implements OnDestroy {

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

  // options
  private _options: ITreeEditorDataCategory[];
  @Input() set options(options: ITreeEditorDataCategory[]) {
    // set data
    this._options = options;

    // sort values
    this.sortValues();

    // flatten & start collapsed
    // - detect changes is triggered by this.collapseExpandAll => this.nonFlatToFlat function
    this.collapseExpandAll(
      true,
      true
    );
  }
  get options(): ITreeEditorDataCategory[] {
    return this._options;
  }

  // empty label
  @Input() emptyLabel: string;

  // add new item
  @Input() addNewItemVisible: boolean = false;
  @Output() addNewItem: EventEmitter<ICreateViewModifyV2TabTableTreeAddNewItem> = new EventEmitter<ICreateViewModifyV2TabTableTreeAddNewItem>();

  // language handler
  private _languageSubscription: Subscription;

  // flattened data
  private _allFlattenedData: (IFlattenNodeCategory | IFlattenNodeInfo | IFlattenNodeCategoryColumns | IFlattenNodeCategoryItem)[] = [];
  flattenedData: (IFlattenNodeCategory | IFlattenNodeInfo | IFlattenNodeCategoryColumns | IFlattenNodeCategoryItem)[] = [];

  // filter
  searchValue: string;

  // copy checkbox value on drag
  copyCheckbox: boolean;

  // small screen mode ?
  isSmallScreenMode: boolean = false;

  // timers
  private _filterTimer: number;
  private _startCopyTimer: number;
  private _newItemFlashTimers: {
    [id: string]: number
  } = {};

  // filter - clear
  filterSuffixIconButtons: IAppFormIconButtonV2[] = [{
    icon: 'clear',
    clickAction: () => {
      this.filter(
        '',
        false,
        false
      );
    },
    visible: () => !!this.searchValue
  }];

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

    // update render mode
    this.updateRenderMode();

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

    // stop timers
    this.stopStartCopyTimer();
    this.stopFilterTimer();

    // stop item flash timers
    Object.keys(this._newItemFlashTimers).forEach((id) => {
      clearTimeout(this._newItemFlashTimers[id]);
      delete this._newItemFlashTimers[id];
    });

    // remove events
    document.removeEventListener(
      'mouseup',
      this.copyCheckboxMouseUpArrow
    );
  }

  /**
   * Write value and construct questionnaire
   */
  writeValue(value: ITreeEditorDataValue): void {
    // // initialize value if necessary
    const previousValue = this.value;
    if (!value) {
      value = {};
    }

    // set value
    super.writeValue(value);

    // no need to re-render because it is the same value ?
    if (JSON.stringify(this.value) === JSON.stringify(previousValue)) {
      return;
    }

    // reset collapse
    // - calls this.nonFlatToFlat
    this.collapseExpandAll(
      true,
      true
    );
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
    if (!this.options?.length) {
      return;
    }

    // sort categories
    this.options.sort((c1, c2): number => {
      return (c1.label ? this.i18nService.instant(c1.label) : '').localeCompare(c2.label ? this.i18nService.instant(c2.label) : '');
    });

    // sort categories items
    this.options.forEach((category) => {
      // nothing to do ?
      if (!category.children?.length) {
        return;
      }

      // sort
      category.children.sort((item1, item2): number => {
        // if same order, compare labels
        if (item1.order === item2.order) {
          return (item1.label ? this.i18nService.instant(item1.label) : '').localeCompare(item2.label ? this.i18nService.instant(item2.label) : '');
        }

        // format order
        let order1: number = Number.MAX_SAFE_INTEGER;
        try {
          order1 = typeof item1.order === 'number' ? item1.order : parseInt(item1.order, 10);
          order1 = isNaN(order1) ? Number.MAX_SAFE_INTEGER : order1;
        } catch (e) {}
        let order2: number = Number.MAX_SAFE_INTEGER;
        try {
          order2 = typeof item2.order === 'number' ? item2.order : parseInt(item2.order, 10);
          order2 = isNaN(order2) ? Number.MAX_SAFE_INTEGER : order2;
        } catch (e) {}

        // compare order
        return order1 - order2;
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
    this.filter(
      this.searchValue,
      false,
      false
    );
  }

  /**
   * Flatten
   */
  private flatten(): void {
    // reset
    this._allFlattenedData = [];

    // nothing to do ?
    if (
      !this.options?.length ||
      !this.value
    ) {
      return;
    }

    // go through categories
    this.options.forEach((category) => {
      // add category
      const categoryNode: IFlattenNodeCategory = {
        type: FlattenType.CATEGORY,
        text: category.label ?
          this.i18nService.instant(category.label) :
          '—',
        data: category
      };
      this._allFlattenedData.push(categoryNode);

      // push items
      let addHeaders: boolean = true;
      category.checked = 0;
      category.children?.forEach((item) => {
        // fix for when an item was selected before being made a system-wide item
        if (
          item.isSystemWide &&
          this.value[category.id] &&
          this.value[category.id][item.id]
        ) {
          delete this.value[category.id][item.id];
        }

        // if view only - display only selected & system-wide if we have at least one selected
        if (this.viewOnly) {
          // not selected, and not system-wide
          if (
            !item.isSystemWide && (
              !this.value[category.id] ||
              !this.value[category.id][item.id]
            )
          ) {
            return;
          }

          // system-wide, but disabled
          if (
            item.isSystemWide && (
              item.disabled ||
              !this.value[category.id] ||
              !Object.keys(this.value[category.id]).length
            )
          ) {
            return;
          }
        }

        // count checked
        if (
          (
            this.value[category.id] &&
            this.value[category.id][item.id]
          ) || (
            item.isSystemWide &&
            !item.disabled
          )
        ) {
          category.checked++;
        }

        // add headers ?
        if (addHeaders) {
          // attach header columns
          this._allFlattenedData.push({
            type: FlattenType.CATEGORY_COLUMNS,
            parent: categoryNode,
            data: {
              id: uuid()
            }
          });

          // no need to add headers again until next category
          addHeaders = false;
        }

        // add item
        this._allFlattenedData.push({
          type: FlattenType.CATEGORY_ITEM,
          parent: categoryNode,
          data: item
        });
      });

      // add info
      if (
        this.viewOnly &&
        category.checked < 1 &&
        this.emptyLabel
      ) {
        // add nothing info text
        this._allFlattenedData.push({
          type: FlattenType.INFO,
          text: this.i18nService.instant(this.emptyLabel),
          parent: categoryNode,
          data: {
            id: uuid()
          }
        });
      }
    });
  }

  /**
   * Stop timer
   */
  private stopFilterTimer(): void {
    if (this._filterTimer) {
      clearTimeout(this._filterTimer);
      this._filterTimer = undefined;
    }
  }

  /**
   * Filter
   */
  filter(
    searchValue: string,
    collapseAll: boolean,
    delay: boolean
  ): void {
    // delay ?
    if (delay) {
      // stop previous
      this.stopFilterTimer();

      // wait
      this._filterTimer = setTimeout(() => {
        // reset
        this._filterTimer = undefined;

        // filter
        this.filter(
          searchValue,
          collapseAll,
          false
        );
      }, 500);

      // finished
      return;
    }

    // update filter value
    this.searchValue = searchValue;

    // nothing to filter ?
    if (!this._allFlattenedData?.length) {
      // empty list
      this.flattenedData = [];

      // update ui
      this.detectChanges();

      // finished
      return;
    }

    // case insensitive
    const byValue: string = (this.searchValue || '').toLowerCase();

    // collapse
    if (collapseAll) {
      this.collapseExpandAll(
        true,
        false
      );
    }

    // filter
    // - we need to determine first all filtered items to be able to show category if one of its children is visible
    const visibleIds: {
      [id: string]: VisibleCause
    } = {};
    this._allFlattenedData.forEach((item): void => {
      // filter
      if (
        !byValue ||
        (
          item.type === FlattenType.CATEGORY &&
          item.text.toLowerCase().indexOf(byValue) > -1
        ) || (
          item.type === FlattenType.INFO && (
            visibleIds[item.parent.data.id] === VisibleCause.SEARCH ||
            item.text.toLowerCase().indexOf(byValue) > -1
          )
        ) || (
          item.type === FlattenType.CATEGORY_ITEM && (
            visibleIds[item.parent.data.id] === VisibleCause.SEARCH || (
              item.data.label &&
              this.i18nService.instant(item.data.label) &&
              this.i18nService.instant(item.data.label).toLowerCase().indexOf(byValue) > -1
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
          // make parent visible
          visibleIds[item.parent.data.id] = VisibleCause.CHILD;

          // expand since a child matched the search criteria
          if (byValue) {
            item.parent.data.collapsed = false;
          }
        } else if (
          byValue &&
          item.type === FlattenType.CATEGORY
        ) {
          // expand since parent matched
          item.data.collapsed = false;
        }
      }

      // since expand / collapse functionality is disabled due to having only "nothing" child item
      // we need to expand it by default, otherwise option won't be visible
      if (
        this.viewOnly &&
        item.type === FlattenType.INFO
      ) {
        item.parent.data.collapsed = false;
      }
    });

    // filter
    this.flattenedData = this._allFlattenedData.filter((item): boolean =>
      (
        item.type === FlattenType.CATEGORY_COLUMNS &&
        !item.parent.data.collapsed
      ) || (
        !!visibleIds[item.data.id] && (
          item.type === FlattenType.CATEGORY ||
          !item.parent.data.collapsed
        )
      )
    );

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
   * Collapse / Expand questions and Answers
   */
  collapseExpandAll(
    collapsed: boolean,
    refresh: boolean
  ): void {
    // nothing to collapse ?
    if (!this.options?.length) {
      return;
    }

    // go through categories and collapse / expand them
    this.options.forEach((item) => {
      item.collapsed = collapsed;
    });

    // refresh
    if (refresh) {
      this.nonFlatToFlat();
    }
  }

  /**
   * Selected item changed
   */
  selectedChanged(
    item: IFlattenNodeCategoryItem,
    checked: boolean
  ): void {
    // update value
    if (
      checked &&
      !item.data.isSystemWide
    ) {
      // initialize category ?
      if (!this.value[item.parent.data.id]) {
        this.value[item.parent.data.id] = {};
      }

      // check item
      this.value[item.parent.data.id][item.data.id] = true;
    } else {
      if (this.value[item.parent.data.id]) {
        delete this.value[item.parent.data.id][item.data.id];
      }
    }

    // reset value
    item.parent.data.checked = 0;
    item.parent.data.children.forEach((option) => {
      // not selected, and not system-wide
      if (
        !option.isSystemWide && (
          !this.value[item.parent.data.id] ||
          !this.value[item.parent.data.id][option.id]
        )
      ) {
        return;
      }

      // system-wide, but disabled
      if (
        option.isSystemWide &&
        option.disabled
      ) {
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
      finish: (
        catItem,
        addAnother
      ) => {
        // something went wrong ?
        if (!catItem?.id) {
          return;
        }

        // append item
        category.data.children.push(catItem);

        // select it, otherwise why did we add it ?
        // - system-wide are selected by default, there is no need to select them
        if (!catItem.isSystemWide) {
          // initialize category ?
          if (!this.value[category.data.id]) {
            this.value[category.data.id] = {};
          }

          // check item
          this.value[category.data.id][catItem.id] = true;
        }

        // sort values using the new translations
        this.sortValues();

        // reset filter
        this.searchValue = undefined;

        // make sure parent is expanded to see the new item
        category.data.collapsed = false;

        // redraw
        // - detect changes is triggered by this.nonFlatToFlat function
        this.nonFlatToFlat();

        // scroll item into view and make it flash / stand out
        if (this.cdkViewport) {
          const itemIndex: number = this.flattenedData.findIndex((item) => item.data.id === catItem.id);
          if (itemIndex > -1) {
            // visible
            this.cdkViewport.scrollToIndex(itemIndex);

            // stop previous
            if (this._newItemFlashTimers[catItem.id]) {
              clearTimeout(this._newItemFlashTimers[catItem.id]);
              delete this._newItemFlashTimers[catItem.id];
            }

            // make it flash
            catItem.flash = true;
            this._newItemFlashTimers[catItem.id] = setTimeout(() => {
              // clear
              delete this._newItemFlashTimers[catItem.id];

              // remove class
              catItem.flash = false;

              // refresh - to remove class from DOM
              // - no need to refresh ui (this.detectChanges()) since it flashes just once, and it will be removed on next refresh anyway
            }, 2000);
          }
        }

        // add another ?
        if (addAnother) {
          this.add(category);
        }
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
      this.viewOnly ||
      event.buttons !== 1 ||
      item.data.disabled ||
      item.data.isSystemWide
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
      this.copyCheckbox = !!this.value[item.parent.data.id] && !!this.value[item.parent.data.id][item.data.id];

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
      this.viewOnly ||
      event.buttons !== 1 ||
      item.data.disabled ||
      item.data.isSystemWide ||
      this.copyCheckbox === undefined
    ) {
      return;
    }

    // update
    this.selectedChanged(
      item,
      this.copyCheckbox
    );
  }

  /**
   * Check / Uncheck all items from a category
   */
  checkUncheckAll(
    item: IFlattenNodeCategory,
    checked: boolean
  ): void {
    // reset value
    item.data.checked = 0;

    // uncheck ?
    if (!checked) {
      // delete
      delete this.value[item.data.id];

      // count system options
      item.data.children?.forEach((option) => {
        // ignore
        if (
          option.disabled ||
          !option.isSystemWide
        ) {
          return;
        }

        // count
        item.data.checked++;
      });
    } else {
      // initialize if necessary
      this.value[item.data.id] = this.value[item.data.id] || {};

      // check children
      item.data.children?.forEach((option) => {
        // ignore inactive options
        if (option.disabled) {
          return;
        }

        // check only if necessary
        if (!option.isSystemWide) {
          this.value[item.data.id][option.id] = true;
        }

        // count
        item.data.checked++;
      });
    }

    // trigger on change
    this.onChange(this.value);

    // mark dirty
    this.control?.markAsDirty();

    // update ui
    this.detectChanges();
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // small screen mode ?
    this.isSmallScreenMode = determineIfSmallScreenMode();
  }
}
