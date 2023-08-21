import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
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
import {
  IVisibleMandatoryDataGroup,
  IVisibleMandatoryDataGroupTab,
  IVisibleMandatoryDataGroupTabSection,
  IVisibleMandatoryDataGroupTabSectionField,
  IVisibleMandatoryDataValue
} from './models/visible-mandatory.model';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

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
  text: string;
  data: IVisibleMandatoryDataGroup;
}

/**
 * Flatten node - group tab
 */
interface IFlattenNodeGroupTab {
  // required
  type: FlattenType.GROUP_TAB;
  parent: IFlattenNodeGroup;
  text: string;
  data: IVisibleMandatoryDataGroupTab;
  sections: IFlattenNodeGroupTabSection[];
}

/**
 * Flatten node - group tab section
 */
interface IFlattenNodeGroupTabSection {
  // required
  type: FlattenType.GROUP_TAB_SECTION;
  parent: IFlattenNodeGroupTab;
  text: string;
  data: IVisibleMandatoryDataGroupTabSection;
  fields: IFlattenNodeGroupTabSectionField[];
}

/**
 * Flatten node - group tab section field
 */
interface IFlattenNodeGroupTabSectionField {
  // required
  type: FlattenType.GROUP_TAB_SECTION_FIELD;
  parent: IFlattenNodeGroupTabSection;
  name: {
    visible: string,
    mandatory: string
  };
  data: IVisibleMandatoryDataGroupTabSectionField;
}

/**
 * Cause why item is visible after filter
 */
enum VisibleCause {
  SEARCH = 1,
  CHILD = 2
}

/**
 * Selected change type
 */
enum FieldSelectedType {
  VISIBLE,
  MANDATORY
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
      false,
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

  // timers
  private _filterTimer: number;

  // constants
  FlattenType = FlattenType;
  FieldSelectedType = FieldSelectedType;

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

  /**
   * Write value
   */
  writeValue(value: IVisibleMandatoryDataValue): void {
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
      false,
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
      !this.options?.length ||
      !this.value
    ) {
      return;
    }

    // go through categories
    this.options.forEach((group) => {
      // add group
      const groupNode: IFlattenNodeGroup = {
        type: FlattenType.GROUP,
        text: this.i18nService.instant(group.label),
        data: group
      };
      this._allFlattenedData.push(groupNode);

      // tabs
      group.children.forEach((tab) => {
        // add group tab
        const groupTabNode: IFlattenNodeGroupTab = {
          type: FlattenType.GROUP_TAB,
          parent: groupNode,
          text: this.i18nService.instant(tab.label),
          data: tab,
          sections: []
        };
        this._allFlattenedData.push(groupTabNode);

        // sections
        tab.children.forEach((section) => {
          // add group tab section
          const groupTabSectionNode: IFlattenNodeGroupTabSection = {
            type: FlattenType.GROUP_TAB_SECTION,
            parent: groupTabNode,
            text: this.i18nService.instant(section.label),
            data: section,
            fields: []
          };
          this._allFlattenedData.push(groupTabSectionNode);
          groupTabNode.sections.push(groupTabSectionNode);

          // fields
          section.children.forEach((field) => {
            // add group tab section field
            const groupTabSectionFieldNode: IFlattenNodeGroupTabSectionField = {
              type: FlattenType.GROUP_TAB_SECTION_FIELD,
              parent: groupTabSectionNode,
              name: {
                visible: `${FormHelperService.IGNORE_FIELD_PREFIX}${groupTabSectionNode.parent.parent.data.id}_${field.id}_visible`,
                mandatory: `${FormHelperService.IGNORE_FIELD_PREFIX}${groupTabSectionNode.parent.parent.data.id}_${field.id}_mandatory`
              },
              data: field
            };
            this._allFlattenedData.push(groupTabSectionFieldNode);
            groupTabSectionNode.fields.push(groupTabSectionFieldNode);
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
        !byValue ||
        (
          item.type === FlattenType.GROUP &&
          item.text &&
          item.text.toLowerCase().indexOf(byValue) > -1
        ) || (
          (
            item.type === FlattenType.GROUP_TAB ||
            item.type === FlattenType.GROUP_TAB_SECTION
          ) && (
            visibleIds[item.parent.data.id] === VisibleCause.SEARCH || (
              item.text &&
              item.text.toLowerCase().indexOf(byValue) > -1
            )
          )
        ) || (
          item.type === FlattenType.GROUP_TAB_SECTION_FIELD && (
            visibleIds[item.parent.data.id] === VisibleCause.SEARCH || (
              item.data.label &&
              this.i18nService.instant(item.data.label).toLowerCase().indexOf(byValue) > -1
            )
          )
        )
      ) {
        // make item visible
        visibleIds[item.data.id] = VisibleCause.SEARCH;

        // parent matched ?
        if (
          byValue && (
            item.type === FlattenType.GROUP_TAB_SECTION ||
            item.type === FlattenType.GROUP_TAB ||
            item.type === FlattenType.GROUP
          )
        ) {
          item.data.collapsed = false;
        }

        // make parent visible if necessary
        if (
          item.type === FlattenType.GROUP_TAB_SECTION_FIELD &&
          !visibleIds[item.parent.data.id]
        ) {
          // make parent visible - section
          visibleIds[item.parent.data.id] = VisibleCause.CHILD;
          item.parent.data.collapsed = false;

          // make parent visible - tab
          if (!visibleIds[item.parent.parent.data.id]) {
            visibleIds[item.parent.parent.data.id] = VisibleCause.CHILD;
            item.parent.parent.data.collapsed = false;
          }

          // make parent visible - group
          if (!visibleIds[item.parent.parent.parent.data.id]) {
            visibleIds[item.parent.parent.parent.data.id] = VisibleCause.CHILD;
            item.parent.parent.parent.data.collapsed = false;
          }
        } else if (
          item.type === FlattenType.GROUP_TAB_SECTION &&
          !visibleIds[item.parent.data.id]
        ) {
          // make parent visible - tab
          visibleIds[item.parent.data.id] = VisibleCause.CHILD;
          item.parent.data.collapsed = false;

          // make parent visible - group
          if (!visibleIds[item.parent.parent.data.id]) {
            visibleIds[item.parent.parent.data.id] = VisibleCause.CHILD;
            item.parent.parent.data.collapsed = false;
          }
        } else if (
          item.type === FlattenType.GROUP_TAB &&
          !visibleIds[item.parent.data.id]
        ) {
          // make parent visible - group
          visibleIds[item.parent.data.id] = VisibleCause.CHILD;
          item.parent.data.collapsed = false;
        }
      }
    });

    // filter
    this.flattenedData = this._allFlattenedData.filter((item): boolean =>
      !!visibleIds[item.data.id] && (
        item.type === FlattenType.GROUP || (
          item.type === FlattenType.GROUP_TAB &&
          !item.parent.data.collapsed
        ) || (
          item.type === FlattenType.GROUP_TAB_SECTION &&
          !item.parent.data.collapsed &&
          !item.parent.parent.data.collapsed
        ) || (
          item.type === FlattenType.GROUP_TAB_SECTION_FIELD &&
          !item.parent.data.collapsed &&
          !item.parent.parent.data.collapsed &&
          !item.parent.parent.parent.data.collapsed
        )
      )
    );

    // update ui
    this.detectChanges();
  }

  /**
   * Expand collapse
   */
  expandCollapse(item: IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection): void {
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
    this.options.forEach((group) => {
      // group
      group.collapsed = collapsed;

      // tabs
      group.children.forEach((tab) => {
        // tab
        tab.collapsed = collapsed;

        // sections
        tab.children.forEach((section) => {
          section.collapsed = collapsed;
        });
      });
    });

    // refresh
    if (refresh) {
      this.nonFlatToFlat();
    }
  }

  /**
   * Update field value
   */
  private updateFieldValue(
    item: IFlattenNodeGroupTabSectionField,
    type: FieldSelectedType,
    checked: boolean
  ): void {
    // update value
    const group: IFlattenNodeGroup = item.parent.parent.parent;
    if (checked) {
      // initialize category ?
      if (!this.value[group.data.id]) {
        this.value[group.data.id] = {};
      }

      // initialize field ?
      if (!this.value[group.data.id][item.data.id]) {
        this.value[group.data.id][item.data.id] = {};
      }

      // check item
      if (type === FieldSelectedType.MANDATORY) {
        this.value[group.data.id][item.data.id].mandatory = true;
      } else {
        this.value[group.data.id][item.data.id].visible = true;
      }
    } else if (this.value[group.data.id]) {
      // if visible removed, then delete everything
      if (type === FieldSelectedType.VISIBLE) {
        delete this.value[group.data.id][item.data.id];
      } else {
        // remove only mandatory ?
        if (this.value[group.data.id][item.data.id]) {
          delete this.value[group.data.id][item.data.id].mandatory;
        }
      }
    }
  }

  /**
   * Selected item changed
   */
  selectedChanged(
    item: IFlattenNodeGroupTabSectionField,
    type: FieldSelectedType,
    checked: boolean
  ): void {
    // update value
    this.updateFieldValue(
      item,
      type,
      checked
    );

    // trigger on change
    this.onChange(this.value);

    // mark dirty
    this.control?.markAsDirty();

    // update ui
    this.detectChanges();
  }

  /**
   * Check / Uncheck all visible fields for a section
   */
  checkUncheckAll(
    sectionOrTab: IFlattenNodeGroupTabSection | IFlattenNodeGroupTab,
    checked: boolean
  ): void {
    // go through children
    const sections: IFlattenNodeGroupTabSection[] = sectionOrTab.type === FlattenType.GROUP_TAB ?
      sectionOrTab.sections :
      [sectionOrTab];
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        // always visible ? then don't change
        if (field.data.visibleMandatoryConf?.visible) {
          return;
        }

        // show / hide
        this.updateFieldValue(
          field,
          FieldSelectedType.VISIBLE,
          checked
        );
      });
    });

    // trigger on change
    this.onChange(this.value);

    // mark dirty
    this.control?.markAsDirty();

    // update ui
    this.detectChanges();
  }
}
