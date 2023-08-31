import {
  CreateViewModifyV2TabInput,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabInputValidatorRequired
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IVisibleMandatoryDataGroupTab, IVisibleMandatoryDataGroupTabSectionField, IVisibleMandatoryDataValueField } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { PersonAndRelatedHelperService } from '../person-and-related-helper.service';
import { v4 as uuid } from 'uuid';
import { OutbreakModel } from '../../../models/outbreak.model';

export class CreateViewModifyHelperModel {
  /**
   * Constructor
   */
  constructor(private parent: PersonAndRelatedHelperService) {}

  /**
   * Determine visible / mandatory definition - address
   */
  private retrieveFieldVisibleMandatoryDefAddress(
    input: CreateViewModifyV2TabInput,
    name: string
  ): IVisibleMandatoryDataGroupTabSectionField[] {
    return [
      {
        id: `${name}.typeId`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_TYPE')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          required: true
        },
        inputHasRequiredValidator: !!(input as ICreateViewModifyV2TabInputValidatorRequired).validators?.required
      }, {
        id: `${name}.date`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_DATE')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.emailAddress`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.phoneNumber`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_PHONE_NUMBER')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.locationId`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_LOCATION')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: !!(input as ICreateViewModifyV2TabInputValidatorRequired).validators?.required
      }, {
        id: `${name}.city`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_CITY')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.postalCode`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.addressLine1`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')}`,
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.geoLocation`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT')} / ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG')}`,
        supportsRequired: false,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.geoLocationAccurate`,
        label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_ADDRESS')} ${this.parent.i18nService.instant('LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES')}`,
        supportsRequired: false,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }, {
            field: `${name}.geoLocation`
          }]
        },
        inputHasRequiredValidator: false
      }
    ];
  }

  /**
   * Determine visible / mandatory definition - document
   */
  private retrieveFieldVisibleMandatoryDefDocument(
    name: string
  ): IVisibleMandatoryDataGroupTabSectionField[] {
    return [
      {
        id: `${name}.type`,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
        supportsRequired: true,
        visibleMandatoryConf: undefined,
        inputHasRequiredValidator: true
      }, {
        id: `${name}.number`,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER',
        supportsRequired: true,
        visibleMandatoryConf: undefined,
        inputHasRequiredValidator: true
      }
    ];
  }

  /**
   * Determine visible / mandatory definition - vaccine
   */
  private retrieveFieldVisibleMandatoryDefVaccine(
    name: string
  ): IVisibleMandatoryDataGroupTabSectionField[] {
    return [
      {
        id: `${name}.vaccine`,
        label: 'LNG_ENTITY_FIELD_LABEL_VACCINE',
        supportsRequired: true,
        visibleMandatoryConf: undefined,
        inputHasRequiredValidator: true
      }, {
        id: `${name}.date`,
        label: 'LNG_ENTITY_FIELD_LABEL_VACCINE_DATE',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.vaccine`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.status`,
        label: 'LNG_ENTITY_FIELD_LABEL_VACCINE_STATUS',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.vaccine`
          }]
        },
        inputHasRequiredValidator: true
      }
    ];
  }

  /**
   * Determine visible / mandatory definition - date range
   */
  private retrieveFieldVisibleMandatoryDefDateRange(
    name: string
  ): IVisibleMandatoryDataGroupTabSectionField[] {
    return [
      {
        id: `${name}.typeId`,
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_TYPE_ID',
        supportsRequired: true,
        visibleMandatoryConf: {
          required: true
        },
        inputHasRequiredValidator: true
      }, {
        id: `${name}.startDate`,
        label: 'LNG_FORM_RANGE_FIELD_LABEL_FROM',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.endDate`,
        label: 'LNG_FORM_RANGE_FIELD_LABEL_TO',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.centerName`,
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.locationId`,
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_LOCATION',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }, {
        id: `${name}.comments`,
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_COMMENTS',
        supportsRequired: true,
        visibleMandatoryConf: {
          needs: [{
            field: `${name}.typeId`
          }]
        },
        inputHasRequiredValidator: false
      }
    ];
  }

  /**
   * Determine visible / mandatory definition
   */
  private retrieveFieldVisibleMandatoryDef(
    input: CreateViewModifyV2TabInput
  ): IVisibleMandatoryDataGroupTabSectionField[] {
    switch (input.type) {
      case CreateViewModifyV2TabInputType.TEXT:
      case CreateViewModifyV2TabInputType.SELECT_SINGLE:
      case CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT:
      case CreateViewModifyV2TabInputType.DATE:
      case CreateViewModifyV2TabInputType.LOCATION_SINGLE:
      case CreateViewModifyV2TabInputType.TEXTAREA:
        return [{
          id: input.name,
          label: input.placeholder(),
          supportsRequired: true,
          visibleMandatoryConf: input.visibleMandatoryConf,
          inputHasRequiredValidator: !!(input as ICreateViewModifyV2TabInputValidatorRequired).validators?.required
        }];

      case CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX:
        return [{
          id: input.name,
          label: input.placeholder(),
          supportsRequired: false,
          visibleMandatoryConf: input.visibleMandatoryConf,
          inputHasRequiredValidator: false
        }];

      case CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH:
        return [{
          id: 'ageDob',
          label: `${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_AGE')} / ${this.parent.i18nService.instant('LNG_ENTITY_FIELD_LABEL_DOB')}`,
          supportsRequired: false,
          visibleMandatoryConf: undefined,
          inputHasRequiredValidator: false
        }];

      case CreateViewModifyV2TabInputType.ADDRESS:
        return this.retrieveFieldVisibleMandatoryDefAddress(
          input,
          input.name
        );

      case CreateViewModifyV2TabInputType.LIST:

        // handle list item types
        switch (input.definition.input.type) {
          case CreateViewModifyV2TabInputType.ADDRESS:
            return this.retrieveFieldVisibleMandatoryDefAddress(
              input.definition.input,
              input.name
            );

          case CreateViewModifyV2TabInputType.DOCUMENT:
            return this.retrieveFieldVisibleMandatoryDefDocument(
              input.name
            );

          case CreateViewModifyV2TabInputType.VACCINE:
            return this.retrieveFieldVisibleMandatoryDefVaccine(
              input.name
            );

          case CreateViewModifyV2TabInputType.CENTER_DATE_RANGE:
            return this.retrieveFieldVisibleMandatoryDefDateRange(
              input.name
            );

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
            children.push(...this.retrieveFieldVisibleMandatoryDef(
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
  tabFilter(
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
    const fieldDefMap: {
      [fieldId: string]: IVisibleMandatoryDataGroupTabSectionField
    } = {};

    // filter
    const previousSections = tab.sections;
    tab.sections = [];
    previousSections.forEach((section) => {
      // filter fields
      const previousInputs = section.inputs;
      section.inputs = [];
      previousInputs.forEach((input) => {
        // if input is list then we need to handle each child input visibility
        if (
          input.type === CreateViewModifyV2TabInputType.ADDRESS ||
          input.type === CreateViewModifyV2TabInputType.LIST
        ) {
          // set handlers
          input.visibleMandatoryChild = {
            visible: (prop: string) => {
              return !!visibleAndMandatoryConf[`${input.name}.${prop}`]?.visible;
            },
            mandatory: (prop: string) => {
              return fieldDefMap[`${input.name}.${prop}`]?.visibleMandatoryConf?.required ||
                visibleAndMandatoryConf[`${input.name}.${prop}`]?.mandatory;
            }
          };
        }

        // determine field id
        const fieldDefs: IVisibleMandatoryDataGroupTabSectionField[] = this.retrieveFieldVisibleMandatoryDef(
          input
        );

        // determine settings
        let visible: boolean = false;
        fieldDefs.forEach((fieldDef) => {
          // map field definition
          fieldDefMap[fieldDef.id] = fieldDef;

          // always required ?
          // IMPORTANT: if special rules are configured as default, then those take precedence
          // Address, Document, ... aren't handled here
          if (
            fieldDefs.length === 1 &&
            fieldDef.supportsRequired
          ) {
            // must apply required ?
            const requiredInput: ICreateViewModifyV2TabInputValidatorRequired = input as ICreateViewModifyV2TabInputValidatorRequired;
            if (
              fieldDef.visibleMandatoryConf?.required ||
              visibleAndMandatoryConf[fieldDef.id]?.mandatory
            ) {
              // check if we don't have a default required validator
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
            } else if (requiredInput.validators?.required) {
              // must remove required
              delete requiredInput.validators.required;
            }
          }

          // always visible ?
          if (
            fieldDef.visibleMandatoryConf?.visible ||
            visibleAndMandatoryConf[fieldDef.id]?.visible || (
              fieldDef.visibleMandatoryConf?.originalName &&
              visibleAndMandatoryConf[fieldDef.visibleMandatoryConf?.originalName]?.visible
            )
          ) {
            // make sure it is visible
            visible = true;
          }
        });

        // visible ?
        if (visible) {
          // make sure it is visible
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
}
