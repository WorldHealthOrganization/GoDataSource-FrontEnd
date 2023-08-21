import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
import { CreateViewModifyV2TabInput, CreateViewModifyV2TabInputType, ICreateViewModifyV2Section, ICreateViewModifyV2Tab } from '../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IVisibleMandatoryDataGroupTab, IVisibleMandatoryDataGroupTabSectionField, IVisibleMandatoryDataValueField } from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { v4 as uuid } from 'uuid';
import { ToastV2Service } from './toast-v2.service';
import { RedirectService } from './redirect.service';
import { OutbreakModel } from '../../models/outbreak.model';
import * as _ from 'lodash';

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
      case CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX:
      case CreateViewModifyV2TabInputType.LOCATION_SINGLE:
      case CreateViewModifyV2TabInputType.TEXTAREA:
        return {
          id: input.name,
          label: input.placeholder(),
          visibleMandatoryConf: input.visibleMandatoryConf,
          definition: input
        };

      case CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH:
        return {
          id: 'ageDob',
          label: `${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_AGE')} / ${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_DOB')}`,
          visibleMandatoryConf: undefined,
          definition: input
        };

      case CreateViewModifyV2TabInputType.ADDRESS:
        return {
          id: input.name,
          label: section.label,
          visibleMandatoryConf: undefined,
          definition: input
        };

      case CreateViewModifyV2TabInputType.LIST:

        // handle list item types
        switch (input.definition.input.type) {
          case CreateViewModifyV2TabInputType.DOCUMENT:
          case CreateViewModifyV2TabInputType.ADDRESS:
          case CreateViewModifyV2TabInputType.VACCINE:
          case CreateViewModifyV2TabInputType.CENTER_DATE_RANGE:
            return {
              id: input.name,
              label: section.label,
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
    originalTab: ICreateViewModifyV2Tab,
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
      return originalTab;
    }

    // visible and mandatory fields
    const visibleAndMandatoryConf: {
      [fieldId: string]: IVisibleMandatoryDataValueField
    } = outbreak.visibleAndMandatoryFields[visibleMandatoryKey];

    // filter
    const filteredTab: ICreateViewModifyV2Tab = _.cloneDeep(originalTab);
    const previousSections = filteredTab.sections;
    filteredTab.sections = [];
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

        // must add field ?
        if (visibleAndMandatoryConf[fieldDef.id]) {
          section.inputs.push(input);
        }
      });

      // must add section ?
      if (section.inputs.length > 0) {
        filteredTab.sections.push(section);
      }
    });

    // remove tab ?
    if (filteredTab.sections.length < 1) {
      filteredTab.visible = () => false;
    }

    // finished
    return filteredTab;
  }
}
