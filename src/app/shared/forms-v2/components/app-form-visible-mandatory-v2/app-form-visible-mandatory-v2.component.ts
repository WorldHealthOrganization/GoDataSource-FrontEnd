import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter,
  forwardRef,
  Host, HostListener,
  Input,
  OnDestroy,
  Optional, Output,
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
import { determineIfSmallScreenMode } from '../../../../core/methods/small-screen-mode';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

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
  tabs: IFlattenNodeGroupTab[];
  checked: {
    visible: number,
    mandatory: number,
    total: number
  };
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
  checked: {
    visible: number,
    mandatory: number,
    total: number
  };
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
  checked: {
    visible: number,
    mandatory: number,
    total: number
  };
}

/**
 * Need field
 */
interface IFlattenNodeGroupTabSectionFieldNeed {
  // required
  groupId: string;
  fieldId: string;
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

  // optional
  needs?: IFlattenNodeGroupTabSectionFieldNeed[];
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

    // update errors
    this.validateAll();

    // count
    this.countAll();

    // update error message
    this.updateErrorsMessage();
  }
  get options(): IVisibleMandatoryDataGroup[] {
    return this._options;
  }

  // errors changed
  @Output() errorsChanged = new EventEmitter<string>();

  // language handler
  private _languageSubscription: Subscription;

  // flattened data
  private _allFlattenedFields: IFlattenNodeGroupTabSectionField[] = [];
  private _allFlattenedData: (IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection | IFlattenNodeGroupTabSectionField)[] = [];
  flattenedData: (IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection | IFlattenNodeGroupTabSectionField)[] = [];
  flattenedFieldsDataMap: {
    [groupId: string]: {
      [fieldId: string]: IFlattenNodeGroupTabSectionField
    }
  } = {};

  // filter
  searchValue: string;

  // small screen mode ?
  isSmallScreenMode: boolean = false;

  // timers
  private _filterTimer: number;

  // handle errors
  private _errorsCount: number;
  errorsMap: {
    [groupId: string]: {
      [fieldId: string]: IFlattenNodeGroupTabSectionFieldNeed[]
    }
  } = {};
  get hasErrors(): boolean {
    return this._errorsCount > 0;
  }

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

    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // stop timers
    this.stopFilterTimer();
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

    // update errors
    this.validateAll();

    // count
    this.countAll();

    // update error message
    this.updateErrorsMessage();
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

        // update errors
        this.updateErrorsMessage();

        // count
        this.countAll();
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
    this._allFlattenedFields = [];
    this.flattenedFieldsDataMap = {};

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
        data: group,
        tabs: [],
        checked: {
          visible: 0,
          mandatory: 0,
          total: 0
        }
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
          sections: [],
          checked: {
            visible: 0,
            mandatory: 0,
            total: 0
          }
        };
        this._allFlattenedData.push(groupTabNode);
        groupNode.tabs.push(groupTabNode);

        // sections
        tab.children.forEach((section) => {
          // add group tab section
          const groupTabSectionNode: IFlattenNodeGroupTabSection = {
            type: FlattenType.GROUP_TAB_SECTION,
            parent: groupTabNode,
            text: this.i18nService.instant(section.label),
            data: section,
            fields: [],
            checked: {
              visible: 0,
              mandatory: 0,
              total: 0
            }
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
            this._allFlattenedFields.push(groupTabSectionFieldNode);
            groupTabSectionNode.fields.push(groupTabSectionFieldNode);

            // initialize field group map if necessary
            if (!this.flattenedFieldsDataMap[group.id]) {
              this.flattenedFieldsDataMap[group.id] = {};
            }

            // add field to map
            this.flattenedFieldsDataMap[group.id][field.id] = groupTabSectionFieldNode;

            // attach needs if necessary
            if (field.visibleMandatoryConf?.needs?.length) {
              // initialize
              groupTabSectionFieldNode.needs = [];

              // add need fields
              field.visibleMandatoryConf.needs.forEach((needField) => {
                groupTabSectionFieldNode.needs.push({
                  groupId: needField.group ?
                    needField.group :
                    group.id,
                  fieldId: needField.field
                });
              });
            }
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

    // count
    this.countAll();
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
      // redraw
      this.nonFlatToFlat();

      // count
      this.countAll();
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

    // validate field
    this.validateAll();

    // count
    this.countAll();

    // update error message
    this.updateErrorsMessage();

    // update ui
    this.detectChanges();
  }

  /**
   * Check / Uncheck all visible fields for a section
   */
  checkUncheckAll(
    item: IFlattenNodeGroup | IFlattenNodeGroupTab | IFlattenNodeGroupTabSection,
    checked: boolean
  ): void {
    // go through children
    let sections: IFlattenNodeGroupTabSection[];
    switch (item.type) {
      case FlattenType.GROUP:
        sections = item.tabs.flatMap((tab) => tab.sections);
        break;
      case FlattenType.GROUP_TAB:
        sections = item.sections;
        break;
      case FlattenType.GROUP_TAB_SECTION:
        sections = [item];
        break;
    }
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

    // update errors
    this.validateAll();

    // count
    this.countAll();

    // update error message
    this.updateErrorsMessage();

    // update ui
    this.detectChanges();
  }

  /**
   * Validate component
   */
  private validateAll(): void {
    // reset
    this.errorsMap = {};
    this._errorsCount = 0;

    // go through fields and validate
    this._allFlattenedFields?.forEach((field) => {
      // nothing to validate ?
      if (
        !field.needs?.length ||
        !this.value ||
        !this.value[field.parent.parent.parent.data.id] ||
        !this.value[field.parent.parent.parent.data.id][field.data.id]?.visible
      ) {
        // finished
        return;
      }

      // validate field
      field.needs.forEach((needField) => {
        // validate
        if (
          !this.value ||
          !this.value[needField.groupId] ||
          !this.value[needField.groupId][needField.fieldId]?.visible
        ) {
          // must initialize group ?
          if (!this.errorsMap[field.parent.parent.parent.data.id]) {
            this.errorsMap[field.parent.parent.parent.data.id] = {};
          }

          // must initialize errors ?
          if (!this.errorsMap[field.parent.parent.parent.data.id][field.data.id]) {
            this.errorsMap[field.parent.parent.parent.data.id][field.data.id] = [];
          }

          // append error
          this.errorsMap[field.parent.parent.parent.data.id][field.data.id].push(needField);
          this._errorsCount++;
        }
      });
    });
  }

  /**
   * Update errors message
   */
  private updateErrorsMessage(): void {
    // construct errors html
    let errorsString: string = '';
    for (const groupId in this.errorsMap) {
      // retrieve group errors
      const groupErrors = this.errorsMap[groupId];
      for (const fieldId in groupErrors) {
        // retrieve field errors
        const fieldErrors = groupErrors[fieldId];
        errorsString += `<br/>- '${this.flattenedFieldsDataMap[groupId][fieldId].parent.parent.parent.text} ${this.i18nService.instant(this.flattenedFieldsDataMap[groupId][fieldId].data.label)}' ${this.i18nService.instant('LNG_COMMON_LABEL_REQUIRES')}`;
        fieldErrors.forEach((needField, index) => {
          errorsString += (index === 0 ? ' ' : ', ') + `'${this.flattenedFieldsDataMap[needField.groupId][needField.fieldId].parent.parent.parent.text} ${this.i18nService.instant(this.flattenedFieldsDataMap[needField.groupId][needField.fieldId].data.label)}'`;
        });
      }
    }

    // make sure we update control
    if (!this.viewOnly) {
      this.control?.updateValueAndValidity();
    }

    // emit errors updated
    this.errorsChanged.emit(errorsString);
  }

  /**
   * Count checked
   */
  private countAll(): void {
    // go through fields and count
    let previousGroupId, previousGroupTabId, previousGroupTabSectionId: string;
    this._allFlattenedFields?.forEach((field) => {
      // reset - group
      if (previousGroupId !== field.parent.parent.parent.data.id) {
        // reset
        field.parent.parent.parent.checked = {
          visible: 0,
          mandatory: 0,
          total: 0
        };

        // north remembers
        previousGroupId = field.parent.parent.parent.data.id;
      }

      // reset - group tab
      if (previousGroupTabId !== field.parent.parent.data.id) {
        // reset
        field.parent.parent.checked = {
          visible: 0,
          mandatory: 0,
          total: 0
        };

        // north remembers
        previousGroupTabId = field.parent.parent.data.id;
      }

      // reset - group tab section
      if (previousGroupTabSectionId !== field.parent.data.id) {
        // reset
        field.parent.checked = {
          visible: 0,
          mandatory: 0,
          total: 0
        };

        // north remembers
        previousGroupTabSectionId = field.parent.data.id;
      }

      // count
      field.parent.parent.parent.checked.total++;
      field.parent.parent.checked.total++;
      field.parent.checked.total++;

      // visible and required
      if (this.value[field.parent.parent.parent.data.id]) {
        // visible ?
        if (this.value[field.parent.parent.parent.data.id][field.data.id]?.visible) {
          field.parent.parent.parent.checked.visible++;
          field.parent.parent.checked.visible++;
          field.parent.checked.visible++;
        }

        // required ?
        if (this.value[field.parent.parent.parent.data.id][field.data.id]?.mandatory) {
          field.parent.parent.parent.checked.mandatory++;
          field.parent.parent.checked.mandatory++;
          field.parent.checked.mandatory++;
        }
      }
    });
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
