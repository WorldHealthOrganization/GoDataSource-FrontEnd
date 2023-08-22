import { Injectable } from '@angular/core';
import { Moment, moment } from '../../helperClasses/x-moment';
import { AuthDataService } from '../data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../models/constants';
import { AgeModel } from '../../models/age.model';
import { Observable } from 'rxjs';
import { TimerCache } from '../../helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { DocumentModel } from '../../models/document.model';
import { AddressModel } from '../../models/address.model';
import { VaccineModel } from '../../models/vaccine.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ReferenceDataEntryModel } from '../../models/reference-data.model';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import * as _ from 'lodash';
import { DialogV2Service } from './dialog-v2.service';
import { ContactModel } from '../../models/contact.model';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../data/contacts-of-contacts.data.service';
import { CreateViewModifyHelperService } from './create-view-modify-helper.service';

@Injectable({
  providedIn: 'root'
})
export class EntityContactOfContactHelperService {
  // data
  public readonly visibleMandatoryKey: string = 'contacts-of-contacts';
  private _authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private dialogV2Service: DialogV2Service,
    private createViewModifyHelperService: CreateViewModifyHelperService
  ) {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();
  }

  /**
   * Generate tab - Personal
   */
  generateTabsPersonal(
    useToFilterOutbreak: OutbreakModel,
    data: {
      selectedOutbreak: OutbreakModel,
      isCreate: boolean,
      itemData: ContactOfContactModel,
      checkForPersonExistence: () => void,
      detectChanges: () => void,
      cocVisualIDMask: {
        mask: string
      },
      parentEntity: ContactModel,
      options: {
        gender: ILabelValuePairModel[],
        pregnancy: ILabelValuePairModel[],
        occupation: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        documentType: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'personal',
      label: data.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.firstName,
                set: (value) => {
                  data.itemData.firstName = value;

                  // check for duplicates
                  data.checkForPersonExistence();
                }
              },
              validators: {
                required: () => true
              },
              visibleMandatoryConf: {
                visible: true,
                required: true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'middleName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.middleName,
                set: (value) => {
                  data.itemData.middleName = value;

                  // check for duplicates
                  data.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.lastName,
                set: (value) => {
                  data.itemData.lastName = value;

                  // check for duplicates
                  data.checkForPersonExistence();
                }
              },
              visibleMandatoryConf: {
                visible: true,
                required: false
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
              options: data.options.gender,
              value: {
                get: () => data.itemData.gender,
                set: (value) => {
                  // set gender
                  data.itemData.gender = value;

                  // reset pregnancy ?
                  if (data.itemData.gender === Constants.GENDER_MALE) {
                    // reset
                    data.itemData.pregnancyStatus = null;

                    // make sure we update pregnancy too
                    tab.form.controls['pregnancyStatus'].markAsDirty();
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
              clearable: false,
              options: data.options.pregnancy,
              value: {
                get: () => data.itemData.pregnancyStatus,
                set: (value) => {
                  data.itemData.pregnancyStatus = value;
                }
              },
              disabled: () => {
                return data.itemData.gender === Constants.GENDER_MALE;
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'occupation',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
              options: data.options.occupation,
              value: {
                get: () => data.itemData.occupation,
                set: (value) => {
                  data.itemData.occupation = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH,
              name: {
                age: 'age',
                dob: 'dob'
              },
              description: {
                age: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
                dob: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB_DESCRIPTION'
              },
              ageChecked: !data.itemData.dob,
              ageTypeYears: data.itemData.age?.months < 1,
              value: {
                age: {
                  years: {
                    get: () => data.itemData.age?.years,
                    set: (value) => {
                      // set value
                      data.itemData.age = data.itemData.age || new AgeModel();
                      data.itemData.age.years = value;

                      // reset
                      data.itemData.dob = null;
                    }
                  },
                  months: {
                    get: () => data.itemData.age?.months,
                    set: (value) => {
                      // set value
                      data.itemData.age = data.itemData.age || new AgeModel();
                      data.itemData.age.months = value;

                      // reset
                      data.itemData.dob = null;
                    }
                  }
                },
                dob: {
                  get: () => data.itemData.dob,
                  set: (value) => {
                    // set value
                    data.itemData.dob = value;

                    // update age
                    if (
                      data.itemData.dob &&
                      (data.itemData.dob as Moment).isValid()
                    ) {
                      // add age object if we don't have one
                      data.itemData.age = data.itemData.age || new AgeModel();

                      // add data
                      const now = moment();
                      data.itemData.age.years = now.diff(data.itemData.dob, 'years');
                      data.itemData.age.months = data.itemData.age.years < 1 ? now.diff(data.itemData.dob, 'months') : 0;
                    } else {
                      data.itemData.age.months = 0;
                      data.itemData.age.years = 0;
                    }
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.createViewModifyHelperService.i18nService.instant(
                'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                data.cocVisualIDMask
              ),
              value: {
                get: () => data.itemData.visualId,
                set: (value) => {
                  data.itemData.visualId = value;
                }
              },
              suffixIconButtons: [
                {
                  icon: 'refresh',
                  tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                  clickAction: (input) => {
                    // nothing to do ?
                    if (!data.cocVisualIDMask) {
                      return;
                    }

                    // generate
                    data.itemData.visualId = this.generateContactOfContactIDMask(data.selectedOutbreak.contactOfContactIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CCC_' + data.selectedOutbreak.id +
                    data.cocVisualIDMask.mask +
                    data.itemData.visualId +
                    (
                      data.isCreate ?
                        '' :
                        data.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
                      data.selectedOutbreak.id,
                      data.cocVisualIDMask.mask,
                      data.itemData.visualId,
                      data.isCreate ?
                        undefined :
                        data.itemData.id
                    )
                  ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                    observer.next(isValid);
                    observer.complete();
                  });
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: data.options.user,
              value: {
                get: () => data.itemData.responsibleUserId,
                set: (value) => {
                  data.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this._authUser),
                html: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'documents',
            items: data.itemData.documents,
            itemsChanged: (list) => {
              // update documents
              data.itemData.documents = list.items;
            },
            definition: {
              add: {
                label: 'LNG_DOCUMENT_LABEL_ADD_NEW_DOCUMENT',
                newItem: () => new DocumentModel()
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT'
              },
              input: {
                type: CreateViewModifyV2TabInputType.DOCUMENT,
                typeOptions: data.options.documentType,
                value: {
                  get: (index: number) => {
                    return data.itemData.documents[index];
                  }
                }
              }
            }
          }]
        },

        // Addresses
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'addresses',
            items: data.itemData.addresses,
            itemsChanged: (list) => {
              // update addresses
              data.itemData.addresses = list.items;
            },
            actionIconButtons: [
              // copy parent address
              {
                icon: 'file_copy',
                tooltip: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_ACTION_COPY_ENTITY_ADDRESS_TOOLTIP',
                click: (
                  _input,
                  addressIndex: number
                ) => {
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_COPY_PARENT_ENTITY_ADDRESS'
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // copy parent address - clone
                    data.itemData.addresses[addressIndex] = new AddressModel(data.parentEntity.mainAddress);

                    // update ui
                    data.detectChanges();
                  });
                },
                visible: () => {
                  return data.isCreate &&
                    !!data.parentEntity?.mainAddress?.typeId;
                }
              }
            ],
            definition: {
              add: {
                label: 'LNG_ADDRESS_LABEL_ADD_NEW_ADDRESS',
                newItem: () => new AddressModel({
                  date: moment().toISOString()
                })
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ADDRESS'
              },
              input: {
                type: CreateViewModifyV2TabInputType.ADDRESS,
                typeOptions: data.options.addressType,
                value: {
                  get: (index: number) => {
                    return data.itemData.addresses[index];
                  }
                },
                validators: {
                  required: () => true
                }
              }
            }
          }]
        }
      ]
    };

    // finished
    return this.createViewModifyHelperService.tabsFilter(
      tab,
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );
  }

  /**
   * Generate tab - Epidemiology
   */
  generateTabsEpidemiology(
    useToFilterOutbreak: OutbreakModel,
    data: {
      isCreate: boolean,
      itemData: ContactOfContactModel,
      options: {
        risk: ILabelValuePairModel[],
        vaccine: ILabelValuePairModel[],
        vaccineStatus: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // today
    const today: Moment = moment();

    // finished
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'infection',
      label: data.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            value: {
              get: () => data.itemData.dateOfReporting,
              set: (value) => {
                data.itemData.dateOfReporting = value;
              }
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'isDateOfReportingApproximate',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => data.itemData.isDateOfReportingApproximate,
              set: (value) => {
                data.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: data.options.risk,
            value: {
              get: () => data.itemData.riskLevel,
              set: (value) => {
                data.itemData.riskLevel = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXTAREA,
            name: 'riskReason',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            value: {
              get: () => data.itemData.riskReason,
              set: (value) => {
                data.itemData.riskReason = value;
              }
            }
          }]
        },

        // Vaccines
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'vaccinesReceived',
            items: data.itemData.vaccinesReceived,
            itemsChanged: (list) => {
              // update documents
              data.itemData.vaccinesReceived = list.items;
            },
            definition: {
              add: {
                label: 'LNG_COMMON_BUTTON_ADD_VACCINE',
                newItem: () => new VaccineModel()
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_VACCINE'
              },
              input: {
                type: CreateViewModifyV2TabInputType.VACCINE,
                vaccineOptions: data.options.vaccine,
                vaccineStatusOptions: data.options.vaccineStatus,
                value: {
                  get: (index: number) => {
                    return data.itemData.vaccinesReceived[index];
                  }
                }
              }
            }
          }]
        }
      ]
    };

    // finished
    return this.createViewModifyHelperService.tabsFilter(
      tab,
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(data: {
    options: {
      occupation: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      gender: ILabelValuePairModel[],
      pregnancy: ILabelValuePairModel[],
      documentType: ILabelValuePairModel[],
      addressType: ILabelValuePairModel[],
      risk: ILabelValuePairModel[],
      vaccine: ILabelValuePairModel[],
      vaccineStatus: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // Contact of contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
        options: data.options.occupation,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        isArray: true,
        sortable: 'addresses.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasCase',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
        options: data.options.gender,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        options: data.options.pregnancy,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'documents.type',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENT_TYPE',
        options: data.options.documentType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'documents.number',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENT_NUMBER',
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_EMAIL',
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'addresses.typeId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_TYPE',
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'addresses.date',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_DATE',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.city',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_CITY',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.postalCode',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
        useLike: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
        options: data.options.risk,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'riskReason',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE',
        options: data.options.vaccine,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        options: data.options.vaccineStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return advancedFilters;
  }

  /**
   * Retrieve statuses forms
   */
  getStatusForms(
    info: {
      // required
      item: ContactOfContactModel,
      risk: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // risk
    if (
      info.item.riskLevel &&
      info.risk.map[info.item.riskLevel]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.TRIANGLE,
        color: info.risk.map[info.item.riskLevel].getColorCode(),
        tooltip: this.createViewModifyHelperService.i18nService.instant(info.item.riskLevel)
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // finished
    return forms;
  }

  /**
   * Return contact id mask with data replaced
   */
  generateContactOfContactIDMask(contactOfContactIdMask: string): string {
    // validate
    if (_.isEmpty(contactOfContactIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return contactOfContactIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }
}
