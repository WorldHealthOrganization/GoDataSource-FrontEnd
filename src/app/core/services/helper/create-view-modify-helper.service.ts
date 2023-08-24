import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
import {
  CreateViewModifyV2TabInput,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Section,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabInputValidatorRequired
} from '../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import {
  IVisibleMandatoryDataGroupTab,
  IVisibleMandatoryDataGroupTabSectionField,
  IVisibleMandatoryDataValueField,
  V2AdvancedFilterToVisibleMandatoryConf
} from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { v4 as uuid } from 'uuid';
import { ToastV2Service } from './toast-v2.service';
import { RedirectService } from './redirect.service';
import { OutbreakModel } from '../../models/outbreak.model';
import * as _ from 'lodash';
import { V2AdvancedFilter } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';

@Injectable()
export class CreateViewModifyHelperService {
  /**
   * Constructor
   */
  constructor(
    public i18nService: I18nService,
    public toastV2Service: ToastV2Service,
    public redirectService: RedirectService
  ) {}

  /**
   * Determine visible / mandatory definition
   */
  private retrieveFieldVisibleMandatoryDef(
    section: ICreateViewModifyV2Section,
    input: CreateViewModifyV2TabInput
  ): IVisibleMandatoryDataGroupTabSectionField {
    switch (input.type) {
      case CreateViewModifyV2TabInputType.TEXT:
      case CreateViewModifyV2TabInputType.SELECT_SINGLE:
      case CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT:
      case CreateViewModifyV2TabInputType.DATE:
      case CreateViewModifyV2TabInputType.LOCATION_SINGLE:
      case CreateViewModifyV2TabInputType.TEXTAREA:
        return {
          id: input.name,
          label: input.placeholder(),
          supportsRequired: true,
          visibleMandatoryConf: input.visibleMandatoryConf,
          definition: input
        };

      case CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX:
        return {
          id: input.name,
          label: input.placeholder(),
          supportsRequired: false,
          visibleMandatoryConf: input.visibleMandatoryConf,
          definition: input
        };

      case CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH:
        return {
          id: 'ageDob',
          label: `${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_AGE')} / ${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_DOB')}`,
          supportsRequired: false,
          visibleMandatoryConf: undefined,
          definition: input
        };

      case CreateViewModifyV2TabInputType.ADDRESS:
        return {
          id: input.name,
          label: section.label,
          supportsRequired: true,
          visibleMandatoryConf: undefined,
          definition: input
        };

      case CreateViewModifyV2TabInputType.LIST:

        // handle list item types
        switch (input.definition.input.type) {
          case CreateViewModifyV2TabInputType.ADDRESS:
            return {
              id: input.name,
              label: section.label,
              supportsRequired: true,
              visibleMandatoryConf: undefined,
              definition: input
            };

          case CreateViewModifyV2TabInputType.DOCUMENT:
          case CreateViewModifyV2TabInputType.VACCINE:
          case CreateViewModifyV2TabInputType.CENTER_DATE_RANGE:
            return {
              id: input.name,
              label: section.label,
              supportsRequired: false,
              visibleMandatoryConf: undefined,
              definition: input
            };

          default:
            throw new Error(`retrieveFieldVisibleMandatoryDef - list: unhandled type '${input.definition.input.type}'`);
        }

      default:
        throw new Error(`retrieveFieldVisibleMandatoryDef - single: unhandled type '${input.type}'`);
    }
  }

  /**
   * Convert create/view/modify tabs to group tabs
   */
  tabsToGroupTabs(tabs: ICreateViewModifyV2Tab[]): IVisibleMandatoryDataGroupTab[] {
    return tabs.map((tab) => {
      return {
        // must be uuid because tab names are the same for multiple groups
        id: uuid(),
        label: tab.label,
        children: tab.sections.map((section) => {
          // construct children inputs
          const children: IVisibleMandatoryDataGroupTabSectionField[] = [];
          section.inputs.forEach((input) => {
            children.push(this.retrieveFieldVisibleMandatoryDef(
              section,
              input
            ));
          });

          // finished
          return {
            // must be uuid because section names are the same for multiple tabs / groups
            id: uuid(),
            label: section.label,
            children
          };
        })
      };
    });
  }

  /**
   * Filter tabs according to outbreak settings
   */
  tabsFilter(
    tab: ICreateViewModifyV2Tab,
    visibleMandatoryKey: string,
    outbreak: OutbreakModel
  ): ICreateViewModifyV2Tab {
    // no changes required ?
    if (
      !outbreak ||
      !outbreak.visibleAndMandatoryFields ||
      !outbreak.visibleAndMandatoryFields[visibleMandatoryKey] ||
      Object.keys(outbreak.visibleAndMandatoryFields[visibleMandatoryKey]).length < 1
    ) {
      return tab;
    }

    // visible and mandatory fields
    const visibleAndMandatoryConf: {
      [fieldId: string]: IVisibleMandatoryDataValueField
    } = outbreak.visibleAndMandatoryFields[visibleMandatoryKey];

    // filter
    const previousSections = tab.sections;
    tab.sections = [];
    previousSections.forEach((section) => {
      // filter fields
      const previousInputs = section.inputs;
      section.inputs = [];
      previousInputs.forEach((input) => {
        // determine field id
        const fieldDef: IVisibleMandatoryDataGroupTabSectionField = this.retrieveFieldVisibleMandatoryDef(
          section,
          input
        );

        // field type not handled ?
        if (!fieldDef?.id) {
          throw new Error(`tabsFilter: couldn't determine field id for type '${input.type}'`);
        }

        // always required ?
        // IMPORTANT: if special rules are configured as default, then those take precedence
        if (
          fieldDef.supportsRequired && (
            fieldDef.visibleMandatoryConf?.required ||
            visibleAndMandatoryConf[fieldDef.id]?.mandatory
          )
        ) {
          // check if we don't have a default required validator
          const requiredInput: ICreateViewModifyV2TabInputValidatorRequired = input as ICreateViewModifyV2TabInputValidatorRequired;
          if (requiredInput.validators?.required) {
            // nothing to do, keep current validator
          } else {
            // must initialize validators ?
            if (
              !requiredInput.validators ||
              Object.keys(requiredInput.validators).length < 1
            ) {
              requiredInput.validators = {};
            }

            // attach required
            requiredInput.validators.required = () => true;
          }
        }

        // always visible ?
        if (fieldDef.visibleMandatoryConf?.visible) {
          // make sure it is visible
          section.inputs.push(input);

          // finished
          return;
        }

        // must add field ?
        if (
          visibleAndMandatoryConf[fieldDef.id]?.visible || (
            fieldDef.visibleMandatoryConf?.originalName &&
            visibleAndMandatoryConf[fieldDef.visibleMandatoryConf?.originalName]?.visible
          )
        ) {
          section.inputs.push(input);
        }
      });

      // must add section ?
      if (section.inputs.length > 0) {
        tab.sections.push(section);
      }
    });

    // remove tab ?
    if (tab.sections.length < 1) {
      tab.visible = () => false;
    }

    // finished
    return tab;
  }

  /**
   * Check if a column should be visible depending on outbreak visible/mandatory settings
   */
  shouldVisibleMandatoryTableColumnBeVisible(
    outbreak: OutbreakModel,
    visibleMandatoryKey: string,
    prop: string
  ): boolean {
    // no custom settings found ?
    if (
      !outbreak ||
      !outbreak.visibleAndMandatoryFields ||
      !outbreak.visibleAndMandatoryFields[visibleMandatoryKey] ||
      outbreak.visibleAndMandatoryFields[visibleMandatoryKey][prop]?.visible ||
      Object.keys(outbreak.visibleAndMandatoryFields[visibleMandatoryKey]).length < 1
    ) {
      return true;
    }

    // matched
    return false;
  }

  /**
   * Filter advanced filters depending on outbreak visible/mandatory settings
   */
  filterVisibleMandatoryAdvancedFilters(advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[]): V2AdvancedFilter[] {
    return (advancedFilters || []).filter((filter) => {
      return filter.visibleMandatoryIf();
    });
  }
}
