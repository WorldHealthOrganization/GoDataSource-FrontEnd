import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Host, HostListener,
  Input,
  OnDestroy,
  Optional,
  SkipSelf,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { determineIfSmallScreenMode } from '../../../../core/methods/small-screen-mode';
import {
  IVisibleMandatoryDataGroup,
  IVisibleMandatoryDataGroupTab,
  IVisibleMandatoryDataGroupTabSection,
  IVisibleMandatoryDataGroupTabSectionField,
  IVisibleMandatoryDataValue
} from './models/visible-mandatory.model';

/**
 * Flatten type
 */
enum FlattenType {
  GROUP,
  GROUP_TAB,
  GROUP_TAB_SECTION,
  GROUP_TAB_SECTION_FIELD
}

/**
 * Flatten node - group
 */
interface IFlattenNodeGroup {
  // required
  type: FlattenType.GROUP;
  data: IVisibleMandatoryDataGroup;
}

/**
 * Flatten node - group tab
 */
interface IFlattenNodeGroupTab {
  // required
  type: FlattenType.GROUP_TAB;
  parent: IFlattenNodeGroup;
  data: IVisibleMandatoryDataGroupTab;
}

/**
 * Flatten node - group tab section
 */
interface IFlattenNodeGroupTabSection {
  // required
  type: FlattenType.GROUP_TAB_SECTION;
  parent: IFlattenNodeGroupTab;
  data: IVisibleMandatoryDataGroupTabSection;
}

/**
 * Flatten node - group tab section field
 */
interface IFlattenNodeGroupTabSectionField {
  // required
  type: FlattenType.GROUP_TAB_SECTION_FIELD;
  parent: IFlattenNodeGroupTabSection;
  data: IVisibleMandatoryDataGroupTabSectionField;
}

/**
 * Cause why item is visible after filter
 */
enum VisibleCause {
  SEARCH = 1,
  CHILD = 2
}

@Component({
  selector: 'app-form-visible-mandatory-v2',
  templateUrl: './app-form-visible-mandatory-v2.component.html',
  styleUrls: ['./app-form-visible-mandatory-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormVisibleMandatoryV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppFormVisibleMandatoryV2Component
  extends AppFormBaseV2<IVisibleMandatoryDataValue> implements OnDestroy {

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
  private _options: IVisibleMandatoryDataGroup[];
  @Input() set options(options: IVisibleMandatoryDataGroup[]) {
    // set data
    this._options = options;

    // flatten & start collapsed
    // - detect changes is triggered by this.collapseExpandAll => this.nonFlatToFlat function
    this.collapseExpandAll(
      true,
      true
    );
  }
  get options(): IVisibleMandatoryDataGroup[] {
    return this._options;
  }

  // language handler
  private _languageSubscription: Subscription;

  // flattened data
  private _allFlattenedData: (IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection | IFlattenNodeGroupTabSectionField)[] = [];
  flattenedData: (IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection | IFlattenNodeGroupTabSectionField)[] = [];

  // filter
  searchValue: string;

  // small screen mode ?
  isSmallScreenMode: boolean = false;

  // timers
  private _filterTimer: number;

  // constants
  FlattenType = FlattenType;

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
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // stop timers
    this.stopFilterTimer();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
  }

  // /**
  //  * Write value
  //  */
  // writeValue(value: IVisibleMandatoryDataValue): void {
  //   // // initialize value if necessary
  //   const previousValue = this.value;
  //   if (!value) {
  //     value = {};
  //   }
  //
  //   // set value
  //   super.writeValue(value);
  //
  //   // no need to re-render because it is the same value ?
  //   if (JSON.stringify(this.value) === JSON.stringify(previousValue)) {
  //     return;
  //   }
  //
  //   // reset collapse
  //   // - calls this.nonFlatToFlat
  //   this.collapseExpandAll(
  //     true,
  //     true
  //   );
  // }

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
      !this.options?.length // ||
      // !this.value
    ) {
      return;
    }

    // go through categories
    this.options.forEach((group) => {
      // add group
      const groupNode: IFlattenNodeGroup = {
        type: FlattenType.GROUP,
        data: group
      };
      this._allFlattenedData.push(groupNode);

      // tabs
      group.children.forEach((tab) => {
        // add group tab
        const groupTabNode: IFlattenNodeGroupTab = {
          type: FlattenType.GROUP_TAB,
          parent: groupNode,
          data: tab
        };
        this._allFlattenedData.push(groupTabNode);

        // sections
        tab.children.forEach((section) => {
          // add group tab section
          const groupTabSectionNode: IFlattenNodeGroupTabSection = {
            type: FlattenType.GROUP_TAB_SECTION,
            parent: groupTabNode,
            data: section
          };
          this._allFlattenedData.push(groupTabSectionNode);

          // fields
          section.children.forEach((field) => {
            // add group tab section field
            const groupTabSectionFieldNode: IFlattenNodeGroupTabSectionField = {
              type: FlattenType.GROUP_TAB_SECTION_FIELD,
              parent: groupTabSectionNode,
              data: field
            };
            this._allFlattenedData.push(groupTabSectionFieldNode);
          });
        });
      });
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
        !byValue // ||
        // (
        //   item.type === FlattenType.CATEGORY &&
        //   item.text.toLowerCase().indexOf(byValue) > -1
        // ) || (
        //   item.type === FlattenType.INFO && (
        //     visibleIds[item.parent.data.id] === VisibleCause.SEARCH ||
        //     item.text.toLowerCase().indexOf(byValue) > -1
        //   )
        // ) || (
        //   item.type === FlattenType.CATEGORY_ITEM && (
        //     visibleIds[item.parent.data.id] === VisibleCause.SEARCH || (
        //       item.data.label &&
        //       this.i18nService.instant(item.data.label) &&
        //       this.i18nService.instant(item.data.label).toLowerCase().indexOf(byValue) > -1
        //     )
        //   )
        // )
      ) {
        // make item visible
        visibleIds[item.data.id] = VisibleCause.SEARCH;

        // make parent visible if necessary
        // if (
        //   (
        //     item.type === FlattenType.CATEGORY_ITEM ||
        //     item.type === FlattenType.INFO
        //   ) &&
        //   !visibleIds[item.parent.data.id]
        // ) {
        //   // make parent visible
        //   visibleIds[item.parent.data.id] = VisibleCause.CHILD;
        //
        //   // expand since a child matched the search criteria
        //   if (byValue) {
        //     item.parent.data.collapsed = false;
        //   }
        // } else if (
        //   byValue &&
        //   item.type === FlattenType.CATEGORY
        // ) {
        //   // expand since parent matched
        //   item.data.collapsed = false;
        // }
      }
    });

    // filter
    this.flattenedData = this._allFlattenedData.filter((item): boolean =>
      !!visibleIds[item.data.id] // && (
      //   item.type === FlattenType.CATEGORY ||
      //   !item.parent.data.collapsed
      // )
    );

    // update ui
    this.detectChanges();
  }

  /**
   * Expand collapse
   */
  expandCollapse(_item: IFlattenNodeGroup): void {
    // // expand / collapse
    // if (item.data.collapsed) {
    //   delete item.data.collapsed;
    // } else {
    //   item.data.collapsed = true;
    // }

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
    _item: IFlattenNodeGroupTabSectionField,
    _checked: boolean
  ): void {
  //   // update value
  //   if (
  //     checked &&
  //     !item.data.isSystemWide
  //   ) {
  //     // initialize category ?
  //     if (!this.value[item.parent.data.id]) {
  //       this.value[item.parent.data.id] = {};
  //     }
  //
  //     // check item
  //     this.value[item.parent.data.id][item.data.id] = true;
  //   } else {
  //     if (this.value[item.parent.data.id]) {
  //       delete this.value[item.parent.data.id][item.data.id];
  //     }
  //   }
  //
  //   // reset value
  //   item.parent.data.checked = 0;
  //   item.parent.data.children.forEach((option) => {
  //     // not selected, and not system-wide
  //     if (
  //       !option.isSystemWide && (
  //         !this.value[item.parent.data.id] ||
  //         !this.value[item.parent.data.id][option.id]
  //       )
  //     ) {
  //       return;
  //     }
  //
  //     // system-wide, but disabled
  //     if (
  //       option.isSystemWide &&
  //       option.disabled
  //     ) {
  //       return;
  //     }
  //
  //     // count
  //     item.parent.data.checked++;
  //   });
  //
  //   // trigger on change
  //   this.onChange(this.value);
  //
  //   // mark dirty
  //   this.control?.markAsDirty();
  //
  //   // update ui
  //   this.detectChanges();
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
