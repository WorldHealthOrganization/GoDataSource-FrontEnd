import { Injectable } from '@angular/core';
import { Moment, moment } from '../../helperClasses/x-moment';
import { AuthDataService } from '../data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { CaseModel } from '../../models/case.model';
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
import { QuestionModel } from '../../models/question.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ReferenceDataEntryModel } from '../../models/reference-data.model';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import * as _ from 'lodash';
import { DialogV2Service } from './dialog-v2.service';
import { ContactDataService } from '../data/contact.data.service';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { TeamModel } from '../../models/team.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EntityType } from '../../models/entity-type';
import { CreateViewModifyHelperService } from './create-view-modify-helper.service';
import { V2AdvancedFilterToVisibleMandatoryConf } from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { EntityHelperService } from './entity-helper.service';
import { EntityFollowUpHelperService } from './entity-follow-up-helper.service';
import { EntityCaseHelperService } from './entity-case-helper.service';

@Injectable({
  providedIn: 'root'
})
export class EntityContactHelperService {
  // data
  public readonly visibleMandatoryKey: string = 'contacts';
  private _authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private dialogV2Service: DialogV2Service,
    private contactDataService: ContactDataService,
    private createViewModifyHelperService: CreateViewModifyHelperService,
    private entityHelperService: EntityHelperService,
    private entityFollowUpHelperService: EntityFollowUpHelperService,
    private entityCaseHelperService: EntityCaseHelperService
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
      itemData: ContactModel,
      checkForPersonExistence: () => void,
      detectChanges: () => void,
      contactVisualIDMask: {
        mask: string
      },
      parentEntity: CaseModel | EventModel,
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
        'LNG_PAGE_CREATE_CONTACT_TAB_PERSONAL_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.firstName,
                set: (value) => {
                  // set data
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.middleName,
                set: (value) => {
                  // set data
                  data.itemData.middleName = value;

                  // check for duplicates
                  data.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.lastName,
                set: (value) => {
                  // set data
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
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
                age: 'LNG_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
                dob: 'LNG_CONTACT_FIELD_LABEL_DOB_DESCRIPTION'
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.createViewModifyHelperService.i18nService.instant(
                'LNG_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                data.contactVisualIDMask
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
                    if (!data.contactVisualIDMask) {
                      return;
                    }

                    // generate
                    data.itemData.visualId = this.generateContactIDMask(data.selectedOutbreak.contactIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CCO_' + data.selectedOutbreak.id +
                    data.contactVisualIDMask.mask +
                    data.itemData.visualId +
                    (
                      data.isCreate ?
                        '' :
                        data.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.contactDataService.checkContactVisualIDValidity(
                      data.selectedOutbreak.id,
                      data.contactVisualIDMask.mask,
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: data.options.user,
              value: {
                get: () => data.itemData.responsibleUserId,
                set: (value) => {
                  data.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this._authUser),
                html: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CONTACT_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_FIELD_LABEL_DOCUMENTS',
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
          label: 'LNG_PAGE_CREATE_CONTACT_TAB_ADDRESS_TITLE',
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
                tooltip: 'LNG_PAGE_CREATE_CONTACT_ACTION_COPY_ENTITY_ADDRESS_TOOLTIP',
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
      itemData: ContactModel,
      options: {
        outcome: ILabelValuePairModel[],
        risk: ILabelValuePairModel[],
        team: ILabelValuePairModel[],
        followUpStatus: ILabelValuePairModel[],
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
        'LNG_PAGE_CREATE_CONTACT_TAB_INFECTION_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => data.itemData.isDateOfReportingApproximate,
              set: (value) => {
                data.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_OUTCOME',
            description: () => 'LNG_CONTACT_FIELD_LABEL_OUTCOME_DESCRIPTION',
            options: data.options.outcome,
            value: {
              get: () => data.itemData.outcomeId,
              set: (value) => {
                // set data
                data.itemData.outcomeId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfOutcome',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME_DESCRIPTION',
            value: {
              get: () => data.itemData.dateOfOutcome,
              set: (value) => {
                data.itemData.dateOfOutcome = value;
              }
            },
            maxDate: today,
            validators: {
              dateSameOrBefore: () => [
                today,
                'dateOfBurial'
              ],
              dateSameOrAfter: () => [
                'dateOfOnset',
                'dateOfInfection'
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'transferRefused',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_TRANSFER_REFUSED',
            description: () => 'LNG_CONTACT_FIELD_LABEL_TRANSFER_REFUSED_DESCRIPTION',
            value: {
              get: () => data.itemData.transferRefused,
              set: (value) => {
                data.itemData.transferRefused = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            value: {
              get: () => data.itemData.riskReason,
              set: (value) => {
                data.itemData.riskReason = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'followUpTeamId',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
            description: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID_DESCRIPTION',
            options: data.options.team,
            value: {
              get: () => data.itemData.followUpTeamId,
              set: (value) => {
                data.itemData.followUpTeamId = value;
              }
            },
            replace: {
              condition: () => !TeamModel.canList(this._authUser),
              html: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CONTACT_CANT_SET_FOLLOW_UP_TEAM_TITLE')
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'followUp[status]',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
            description: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS_DESCRIPTION',
            options: data.options.followUpStatus,
            value: {
              get: () => data.itemData.followUp?.status,
              set: (value) => {
                // initialize
                if (!data.itemData.followUp) {
                  data.itemData.followUp = {} as any;
                }

                // set data
                data.itemData.followUp.status = value;
              }
            }
          }]
        },

        // Vaccines
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
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
  generateAdvancedFilters(
    selectedOutbreak: OutbreakModel,
    data: {
      contactInvestigationTemplate: () => QuestionModel[],
      contactFollowUpTemplate: () => QuestionModel[],
      caseInvestigationTemplate: () => QuestionModel[],
      options: {
        occupation: ILabelValuePairModel[],
        followUpStatus: ILabelValuePairModel[],
        pregnancy: ILabelValuePairModel[],
        vaccine: ILabelValuePairModel[],
        vaccineStatus: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[],
        team: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        dailyFollowUpStatus: ILabelValuePairModel[],
        gender: ILabelValuePairModel[],
        documentType: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[],
        risk: ILabelValuePairModel[],
        investigationStatus: ILabelValuePairModel[],
        classification: ILabelValuePairModel[],
        clusterLoad: (finished: (data: IResolverV2ResponseModel<any>) => void) => void,
        outcome: ILabelValuePairModel[],
        dateRangeType: ILabelValuePairModel[],
        dateRangeCenter: ILabelValuePairModel[],
        certaintyLevel: ILabelValuePairModel[],
        exposureType: ILabelValuePairModel[],
        exposureFrequency: ILabelValuePairModel[],
        exposureDuration: ILabelValuePairModel[],
        contextOfTransmission: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      // Contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'firstName'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'middleName'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'lastName'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'occupation'
        ),
        options: data.options.occupation,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'riskLevel'
        ),
        options: data.options.risk,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'outcomeId',
        label: 'LNG_CONTACT_FIELD_LABEL_OUTCOME',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'outcomeId'
        ),
        options: data.options.outcome,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfOutcome',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfOutcome'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'transferRefused',
        label: 'LNG_CONTACT_FIELD_LABEL_TRANSFER_REFUSED',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'transferRefused'
        ),
        options:  data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'riskReason',
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'riskReason'
        ),
        sortable: true
      },
      {
        field: 'gender',
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'gender'
        ),
        type: V2AdvancedFilterType.MULTISELECT,
        options: data.options.gender,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_FIELD_LABEL_AGE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'ageDob'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfReporting'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'isDateOfReportingApproximate'
        ),
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'ageDob'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'visualId'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateBecomeContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateBecomeContact'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        isArray: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUp.status',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        visibleMandatoryIf: () => true,
        options: data.options.followUpStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'followUp.startDate',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_START_DATE',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'followUp.endDate',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfLastContact'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => true,
        template: data.contactInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'pregnancyStatus'
        ),
        options: data.options.pregnancy,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'vaccinesReceived'
        ),
        options: data.options.vaccine,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'vaccinesReceived'
        ),
        options: data.options.vaccineStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_DATE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'vaccinesReceived'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'documents.type',
        label: 'LNG_CONTACT_FIELD_LABEL_DOCUMENT_TYPE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'documents'
        ),
        options: data.options.documentType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'documents.number',
        label: 'LNG_CONTACT_FIELD_LABEL_DOCUMENT_NUMBER',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'documents'
        ),
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_FIELD_LABEL_EMAIL',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'addresses.typeId',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_TYPE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'addresses.date',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_DATE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.city',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_CITY',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        sortable: true,
        useLike: true,
        relationshipLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.postalCode',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'addresses'
        ),
        sortable: true,
        useLike: true,
        relationshipLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasCase',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        visibleMandatoryIf: () => true,
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContactOfContact',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        visibleMandatoryIf: () => true,
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_CONTACT_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_CONTACT_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_CONTACT_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // relationship
    if (
      ContactModel.canListRelationshipExposures(this._authUser) ||
      ContactModel.canListRelationshipContacts(this._authUser)
    ) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'clusterId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'clusterId'
          ),
          relationshipPath: ['relationships'],
          optionsLoad: data.options.clusterLoad,
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'contactDate',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'contactDate'
          ),
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'contactDateEstimated',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'contactDateEstimated'
          ),
          options: data.options.yesNo,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'certaintyLevelId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'certaintyLevelId'
          ),
          options: data.options.certaintyLevel,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'exposureTypeId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'exposureTypeId'
          ),
          options: data.options.exposureType,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'exposureFrequencyId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'exposureFrequencyId'
          ),
          options: data.options.exposureFrequency,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'exposureDurationId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'exposureDurationId'
          ),
          options: data.options.exposureDuration,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'socialRelationshipTypeId',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'socialRelationshipTypeId'
          ),
          options: data.options.contextOfTransmission,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'socialRelationshipDetail',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'socialRelationshipDetail'
          ),
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'comment',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityHelperService.visibleMandatoryKey,
            'comment'
          ),
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.DELETED,
          field: 'deleted',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_DELETED',
          visibleMandatoryIf: () => true,
          yesNoAllOptions: data.options.yesNoAll,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'createdAt',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'updatedAt',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        },
        {
          type: V2AdvancedFilterType.DELETED_AT,
          field: 'deletedAt',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_DELETED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        }
      );

      // allowed to filter by user ?
      if (UserModel.canListForFilters(this._authUser)) {
        advancedFilters.push({
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['relationships'],
          relationshipLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP'
        });
      }
    }

    // allowed to filter by follow-up team ?
    if (TeamModel.canList(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUpTeamId',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'followUpTeamId'
        ),
        options: data.options.team,
        sortable: true
      });
    }

    // allowed to filter by follow-up user ?
    if (UserModel.canListForFilters(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'responsibleUserId'
        ),
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_CONTACT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      });
    }

    // Relation - Follow-up
    if (FollowUpModel.canList(this._authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'date',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'date'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.RANGE_NUMBER,
          field: 'index',
          label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
          visibleMandatoryIf: () => true,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'targeted',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'targeted'
          ),
          options: data.options.yesNo,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'statusId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'statusId'
          ),
          options: data.options.dailyFollowUpStatus,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          field: 'questionnaireAnswers',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          visibleMandatoryIf: () => true,
          template: data.contactFollowUpTemplate,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.ADDRESS,
          field: 'address',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          isArray: false,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.DELETED,
          field: 'deleted',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
          visibleMandatoryIf: () => true,
          yesNoAllOptions: data.options.yesNoAll,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'createdAt',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'updatedAt',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.DELETED_AT,
          field: 'deletedAt',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'address.typeId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_TYPE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          options: data.options.addressType,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'address.date',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'address.emailAddress',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
          field: 'address',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          isArray: false,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.LOCATION_MULTIPLE,
          field: 'address',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_LOCATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'address.city',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_CITY',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'address.postalCode',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_POSTAL_CODE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'address.geoLocationAccurate',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'address'
          ),
          options: data.options.yesNo,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        }
      );

      // allowed to filter by user ?
      if (UserModel.canListForFilters(this._authUser)) {
        advancedFilters.push({
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityFollowUpHelperService.visibleMandatoryKey,
            'responsibleUserId'
          ),
          options: data.options.user,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        });
      }
    }

    // case condition
    const caseCondition = new RequestQueryBuilder();
    caseCondition.filter.byEquality(
      'type',
      EntityType.CASE
    );

    // Relation - Cases
    if (CaseModel.canList(this._authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'firstName',
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'firstName'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'middleName',
          label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'middleName'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'lastName',
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'lastName'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'gender',
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'gender'
          ),
          options: data.options.gender,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_AGE,
          field: 'age',
          label: 'LNG_CASE_FIELD_LABEL_AGE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'ageDob'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          field: 'questionnaireAnswers',
          label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          visibleMandatoryIf: () => true,
          template: data.caseInvestigationTemplate,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.ADDRESS,
          field: 'addresses',
          label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'addresses'
          ),
          isArray: true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'visualId',
          label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'visualId'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'investigationStatus',
          label: 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'investigationStatus'
          ),
          options: data.options.investigationStatus,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'classification',
          label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'classification'
          ),
          options: data.options.classification,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateBecomeCase',
          label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateBecomeCase'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dob',
          label: 'LNG_CASE_FIELD_LABEL_DOB',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'ageDob'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfInfection',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateOfInfection'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateInvestigationCompleted',
          label: 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateInvestigationCompleted'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfOnset',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateOfOnset'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'isDateOfOnsetApproximate',
          label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'isDateOfOnsetApproximate'
          ),
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfOutcome',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateOfOutcome'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfReporting',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateOfReporting'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'isDateOfReportingApproximate',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'isDateOfReportingApproximate'
          ),
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_NUMBER,
          field: 'numberOfContacts',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_NUMBER,
          field: 'numberOfExposures',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'occupation',
          label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'occupation'
          ),
          options: data.options.occupation,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'outcomeId',
          label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'outcomeId'
          ),
          options: data.options.outcome,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
          field: 'addresses',
          label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'addresses'
          ),
          isArray: true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'pregnancyStatus',
          label: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'pregnancyStatus'
          ),
          options: data.options.pregnancy,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'transferRefused',
          label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'transferRefused'
          ),
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'riskLevel',
          label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'riskLevel'
          ),
          options: data.options.risk,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'riskReason',
          label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'riskReason'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'vaccinesReceived.vaccine',
          label: 'LNG_CASE_FIELD_LABEL_VACCINE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'vaccinesReceived'
          ),
          options: data.options.vaccine,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'vaccinesReceived.status',
          label: 'LNG_CASE_FIELD_LABEL_VACCINE_STATUS',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'vaccinesReceived'
          ),
          options: data.options.vaccineStatus,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'vaccinesReceived.date',
          label: 'LNG_CASE_FIELD_LABEL_VACCINE_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'vaccinesReceived'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'wasContact',
          label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
          visibleMandatoryIf: () => true,
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'wasContactOfContact',
          label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
          visibleMandatoryIf: () => true,
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'safeBurial',
          label: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'safeBurial'
          ),
          options: data.options.yesNo,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'documents.type',
          label: 'LNG_CASE_FIELD_LABEL_DOCUMENT_TYPE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'documents'
          ),
          options: data.options.documentType,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'documents.number',
          label: 'LNG_CASE_FIELD_LABEL_DOCUMENT_NUMBER',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'documents'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'addresses.emailAddress',
          label: 'LNG_CASE_FIELD_LABEL_EMAIL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'addresses'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.LOCATION_MULTIPLE,
          field: 'deathLocationId',
          label: 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'deathLocationId'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfBurial',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateOfBurial'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.LOCATION_MULTIPLE,
          field: 'burialLocationId',
          label: 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'burialLocationId'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'dateRanges.typeId',
          label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_TYPE_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          options: data.options.dateRangeType,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateRanges.startDate',
          label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_START_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES')} ${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS')}`,
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateRanges.endDate',
          label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_END_DATE',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES')} ${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS')}`,
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'dateRanges.centerName',
          label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          options: data.options.dateRangeCenter,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES')} ${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS')}`,
          extraConditions: caseCondition
        },
        {
          // parentLocationIdFilter is appended by the component
          type: V2AdvancedFilterType.LOCATION_MULTIPLE,
          field: 'dateRanges',
          label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_LOCATION',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES')} ${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS')}`,
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'dateRanges.comments',
          label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_COMMENTS',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'dateRanges'
          ),
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES')} ${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS')}`,
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.DELETED,
          field: 'deleted',
          label: 'LNG_CASE_FIELD_LABEL_DELETED',
          visibleMandatoryIf: () => true,
          yesNoAllOptions: data.options.yesNoAll,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'createdAt',
          label: 'LNG_CASE_FIELD_LABEL_CREATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'updatedAt',
          label: 'LNG_CASE_FIELD_LABEL_UPDATED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          type: V2AdvancedFilterType.DELETED_AT,
          field: 'deletedAt',
          label: 'LNG_CASE_FIELD_LABEL_DELETED_AT',
          visibleMandatoryIf: () => true,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        }
      );

      // allowed to filter by user ?
      if (UserModel.canListForFilters(this._authUser)) {
        advancedFilters.push({
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
          visibleMandatoryIf: () => this.createViewModifyHelperService.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.entityCaseHelperService.visibleMandatoryKey,
            'responsibleUserId'
          ),
          options: data.options.user,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_CASE_FIELD_LABEL_CREATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_CASE_FIELD_LABEL_UPDATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        });
      }
    }

    // finished
    return this.createViewModifyHelperService.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Retrieve statuses forms
   */
  getStatusForms(
    info: {
      // required
      item: ContactModel,
      risk: IResolverV2ResponseModel<ReferenceDataEntryModel>,
      outcome: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // outcome
    if (
      info.item.outcomeId &&
      info.outcome.map[info.item.outcomeId]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.HEXAGON,
        color: info.outcome.map[info.item.outcomeId].getColorCode(),
        tooltip: this.createViewModifyHelperService.i18nService.instant(info.item.outcomeId)
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

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

    // as per current date
    if (
      info.item.followUp?.startDate &&
      moment().isSameOrBefore(info.item.followUp?.startDate)
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-follow-up-not-started)',
        tooltip: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_NOT_STARTED')
      });
    } else if (
      info.item.followUp?.startDate &&
      info.item.followUp?.endDate &&
      moment().isBetween(
        info.item.followUp?.startDate,
        info.item.followUp?.endDate,
        undefined,
        '[]'
      )
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-under-follow-up)',
        tooltip: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_UNDER_FOLLOW_UP')
      });
    } else if (
      info.item.followUp?.endDate &&
      moment().isSameOrAfter(info.item.followUp?.endDate)
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-follow-up-ended)',
        tooltip: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_ENDED_FOLLOW_UP')
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: this.createViewModifyHelperService.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
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
  generateContactIDMask(contactIdMask: string): string {
    // validate
    if (_.isEmpty(contactIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return contactIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }
}
