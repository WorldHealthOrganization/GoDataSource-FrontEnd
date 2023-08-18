import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IVisibleMandatoryDataGroupTab, IVisibleMandatoryDataGroupTabSectionField } from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { v4 as uuid } from 'uuid';
import { ToastV2Service } from './toast-v2.service';
import { RedirectService } from './redirect.service';

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
            switch (input.type) {
              case CreateViewModifyV2TabInputType.TEXT:
              case CreateViewModifyV2TabInputType.SELECT_SINGLE:
              case CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT:
              case CreateViewModifyV2TabInputType.DATE:
              case CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX:
              case CreateViewModifyV2TabInputType.LOCATION_SINGLE:
              case CreateViewModifyV2TabInputType.TEXTAREA:
                // add to list
                children.push({
                  id: input.name,
                  label: input.placeholder(),
                  visibleMandatoryConf: input.visibleMandatoryConf,
                  definition: input
                });

                // finished
                break;

              case CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH:
                // add to list
                children.push({
                  id: 'ageDob',
                  label: `${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_AGE')} / ${this.i18nService.instant('LNG_ENTITY_FIELD_LABEL_DOB')}`,
                  visibleMandatoryConf: undefined,
                  definition: input
                });

                // finished
                break;

              case CreateViewModifyV2TabInputType.ADDRESS:
                // add to list
                children.push({
                  id: input.name,
                  label: section.label,
                  visibleMandatoryConf: undefined,
                  definition: input
                });

                // finished
                break;

              case CreateViewModifyV2TabInputType.LIST:

                // handle list item types
                switch (input.definition.input.type) {
                  case CreateViewModifyV2TabInputType.DOCUMENT:
                  case CreateViewModifyV2TabInputType.ADDRESS:
                  case CreateViewModifyV2TabInputType.VACCINE:
                  case CreateViewModifyV2TabInputType.CENTER_DATE_RANGE:
                    // add to list
                    children.push({
                      id: input.name,
                      label: section.label,
                      visibleMandatoryConf: undefined,
                      definition: input
                    });

                    // finished
                    break;

                  default:
                    throw new Error(`tabsToGroupTabs - list: unhandled type '${input.definition.input.type}'`);
                }

                // finished
                break;

              default:
                throw new Error(`tabsToGroupTabs - single: unhandled type '${input.type}'`);
            }
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
}
