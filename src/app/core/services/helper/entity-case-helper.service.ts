import { Injectable } from '@angular/core';
import { Moment, moment } from '../../helperClasses/x-moment';
import { CaseDataService } from '../data/case.data.service';
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
import { CaseCenterDateRangeModel } from '../../models/case-center-date-range.model';
import { QuestionModel } from '../../models/question.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ReferenceDataEntryModel } from '../../models/reference-data.model';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import * as _ from 'lodash';
import { CreateViewModifyHelperService } from './create-view-modify-helper.service';

@Injectable({
  providedIn: 'root'
})
export class EntityCaseHelperService {
  // data
  public readonly visibleMandatoryKey: string = 'cases';
  private _authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private caseDataService: CaseDataService,
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
      itemData: CaseModel,
      checkForPersonExistence: () => void,
      caseVisualIDMask: {
        mask: string
      },
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
        'LNG_PAGE_CREATE_CASE_TAB_PERSONAL_TITLE' :
        'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_LAST_NAME_DESCRIPTION',
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_GENDER',
              description: () => 'LNG_CASE_FIELD_LABEL_GENDER_DESCRIPTION',
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CASE_FIELD_LABEL_OCCUPATION_DESCRIPTION',
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
                age: 'LNG_CASE_FIELD_LABEL_AGE_DESCRIPTION',
                dob: 'LNG_CASE_FIELD_LABEL_DOB_DESCRIPTION'
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
              description: () => this.createViewModifyHelperService.i18nService.instant(
                'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                data.caseVisualIDMask
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
                    if (!data.caseVisualIDMask) {
                      return;
                    }

                    // generate
                    data.itemData.visualId = this.generateCaseIDMask(data.selectedOutbreak.caseIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CCA_' + data.selectedOutbreak.id +
                    data.caseVisualIDMask.mask +
                    data.itemData.visualId +
                    (
                      data.isCreate ?
                        '' :
                        data.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.caseDataService.checkCaseVisualIDValidity(
                      data.selectedOutbreak.id,
                      data.caseVisualIDMask.mask,
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
              placeholder: () => 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: data.options.user,
              value: {
                get: () => data.itemData.responsibleUserId,
                set: (value) => {
                  data.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this._authUser),
                html: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CASE_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS',
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
          label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'addresses',
            items: data.itemData.addresses,
            itemsChanged: (list) => {
              // update addresses
              data.itemData.addresses = list.items;
            },
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
      selectedOutbreak: OutbreakModel,
      isCreate: boolean,
      itemData: CaseModel,
      checkForOnsetAfterReporting: () => void,
      checkForOnsetAfterHospitalizationStartDate: () => void,
      options: {
        classification: ILabelValuePairModel[],
        investigationStatus: ILabelValuePairModel[],
        outcome: ILabelValuePairModel[],
        risk: ILabelValuePairModel[],
        vaccine: ILabelValuePairModel[],
        vaccineStatus: ILabelValuePairModel[],
        dateRangeType: ILabelValuePairModel[],
        dateRangeCenter: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // today
    const today: Moment = moment();

    // create tab
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'infection',
      label: data.isCreate ?
        'LNG_PAGE_CREATE_CASE_TAB_INFECTION_TITLE' :
        'LNG_PAGE_MODIFY_CASE_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'classification',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            description: () => 'LNG_CASE_FIELD_LABEL_CLASSIFICATION_DESCRIPTION',
            options: data.options.classification,
            value: {
              get: () => data.itemData.classification,
              set: (value) => {
                data.itemData.classification = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfOnset',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET_DESCRIPTION',
            value: {
              get: () => data.itemData.dateOfOnset,
              set: (value) => {
                // set data
                data.itemData.dateOfOnset = value;

                // check onset after reporting
                data.checkForOnsetAfterReporting();
              }
            },
            maxDate: today,
            validators: {
              required: () => !!data.selectedOutbreak.isDateOfOnsetRequired,
              dateSameOrBefore: () => [
                today,
                'dateOfOutcome'
              ],
              dateSameOrAfter: () => [
                'dateOfInfection'
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'isDateOfOnsetApproximate',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
            description: () => 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => data.itemData.isDateOfOnsetApproximate,
              set: (value) => {
                data.itemData.isDateOfOnsetApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateBecomeCase',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE_DESCRIPTION',
            value: {
              get: () => data.itemData.dateBecomeCase,
              set: (value) => {
                data.itemData.dateBecomeCase = value;
              }
            },
            maxDate: today,
            validators: {
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfInfection',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION_DESCRIPTION',
            value: {
              get: () => data.itemData.dateOfInfection,
              set: (value) => {
                data.itemData.dateOfInfection = value;
              }
            },
            maxDate: today,
            validators: {
              dateSameOrBefore: () => [
                today,
                'dateOfOutcome',
                'dateOfOnset'
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'investigationStatus',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
            description: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS_DESCRIPTION',
            options: data.options.investigationStatus,
            value: {
              get: () => data.itemData.investigationStatus,
              set: (value) => {
                data.itemData.investigationStatus = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateInvestigationCompleted',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED_DESCRIPTION',
            value: {
              get: () => data.itemData.dateInvestigationCompleted,
              set: (value) => {
                data.itemData.dateInvestigationCompleted = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_OUTCOME',
            description: () => 'LNG_CASE_FIELD_LABEL_OUTCOME_DESCRIPTION',
            options: data.options.outcome,
            value: {
              get: () => data.itemData.outcomeId,
              set: (value) => {
                // set data
                data.itemData.outcomeId = value;

                // reset data if not deceased
                if (data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED) {
                  data.itemData.deathLocationId = null;
                  data.itemData.safeBurial = null;
                  data.itemData.dateOfBurial = null;
                  data.itemData.burialLocationId = null;
                  data.itemData.burialPlaceName = null;
                }
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfOutcome',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME_DESCRIPTION',
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
            placeholder: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
            description: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED_DESCRIPTION',
            value: {
              get: () => data.itemData.transferRefused,
              set: (value) => {
                data.itemData.transferRefused = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.LOCATION_SINGLE,
            name: 'deathLocationId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID',
            description: () => 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID_DESCRIPTION',
            useOutbreakLocations: true,
            value: {
              get: () => data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                data.itemData.deathLocationId,
              set: (value) => {
                data.itemData.deathLocationId = value;
              }
            },
            disabled: () => {
              return data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'safeBurial',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL_DESCRIPTION',
            value: {
              get: () => data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                false :
                data.itemData.safeBurial,
              set: (value) => {
                data.itemData.safeBurial = value;
              }
            },
            disabled: () => {
              return data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfBurial',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL_DESCRIPTION',
            value: {
              get: () => data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                data.itemData.dateOfBurial,
              set: (value) => {
                data.itemData.dateOfBurial = value;
              }
            },
            maxDate: today,
            validators: {
              dateSameOrBefore: () => [
                today
              ],
              dateSameOrAfter: () => [
                'dateOfOutcome'
              ]
            },
            disabled: () => {
              return data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.LOCATION_SINGLE,
            name: 'burialLocationId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL_DESCRIPTION',
            useOutbreakLocations: true,
            value: {
              get: () => data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                data.itemData.burialLocationId,
              set: (value) => {
                data.itemData.burialLocationId = value;
              }
            },
            disabled: () => {
              return data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'burialPlaceName',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
            description: () => 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME_DESCRIPTION',
            value: {
              get: () => data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                data.itemData.burialPlaceName,
              set: (value) => {
                data.itemData.burialPlaceName = value;
              }
            },
            disabled: () => {
              return data.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            value: {
              get: () => data.itemData.dateOfReporting,
              set: (value) => {
                // set data
                data.itemData.dateOfReporting = value;

                // check onset after reporting
                data.checkForOnsetAfterReporting();
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
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => data.itemData.isDateOfReportingApproximate,
              set: (value) => {
                data.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
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
            placeholder: () => 'LNG_CASE_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CASE_FIELD_LABEL_RISK_REASON_DESCRIPTION',
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
          label: 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
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
        },

        // Date ranges
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'dateRanges',
            items: data.itemData.dateRanges,
            itemsChanged: (list) => {
              // update documents
              data.itemData.dateRanges = list.items;

              // validate hospitalization start date against date of onset
              data.checkForOnsetAfterHospitalizationStartDate();
            },
            definition: {
              add: {
                label: 'LNG_COMMON_BUTTON_ADD_DATE_RANGE',
                newItem: () => new CaseCenterDateRangeModel()
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DATE_RANGE'
              },
              input: {
                type: CreateViewModifyV2TabInputType.CENTER_DATE_RANGE,
                typeOptions: data.options.dateRangeType,
                centerOptions: data.options.dateRangeCenter,
                value: {
                  get: (index: number) => {
                    return data.itemData.dateRanges[index];
                  }
                },
                changed: () => {
                  // validate hospitalization start date against date of onset
                  data.checkForOnsetAfterHospitalizationStartDate();
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
    caseInvestigationTemplate: () => QuestionModel[],
    options: {
      gender: ILabelValuePairModel[],
      occupation: ILabelValuePairModel[],
      risk: ILabelValuePairModel[],
      classification: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      outcome: ILabelValuePairModel[],
      clusterLoad: (finished: (data: IResolverV2ResponseModel<any>) => void) => void,
      pregnancy: ILabelValuePairModel[],
      vaccine: ILabelValuePairModel[],
      vaccineStatus: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      investigationStatus: ILabelValuePairModel[],
      documentType: ILabelValuePairModel[],
      addressType: ILabelValuePairModel[],
      dateRangeType: ILabelValuePairModel[],
      dateRangeCenter: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // Case
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_CASE_FIELD_LABEL_GENDER',
        options: data.options.gender,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CASE_FIELD_LABEL_AGE'
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
        isArray: true,
        sortable: 'addresses.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CASE_FIELD_LABEL_DOB',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
        options: data.options.occupation,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
        options: data.options.risk,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'riskReason',
        label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'classification',
        label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        options: data.options.classification,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfInfection',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfOutcome',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateBecomeCase',
        label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'safeBurial',
        label: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfOnsetApproximate',
        label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'transferRefused',
        label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'investigationStatus',
        label: 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
        options: data.options.investigationStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateInvestigationCompleted',
        label: 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'outcomeId',
        label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
        options: data.options.outcome,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContactOfContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'clusterId',
        label: 'LNG_CASE_FIELD_LABEL_CLUSTER_NAME',
        relationshipPath: ['relationships'],
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER',
        optionsLoad: data.options.clusterLoad,
        sortable: true
      }, {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: data.caseInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
        options: data.options.pregnancy,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE',
        options: data.options.vaccine,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE_STATUS',
        options: data.options.vaccineStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'documents.type',
        label: 'LNG_CASE_FIELD_LABEL_DOCUMENT_TYPE',
        options: data.options.documentType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'documents.number',
        label: 'LNG_CASE_FIELD_LABEL_DOCUMENT_NUMBER',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.emailAddress',
        label: 'LNG_CASE_FIELD_LABEL_EMAIL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'addresses.typeId',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_TYPE',
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'addresses.date',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_DATE',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.city',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_CITY',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.postalCode',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'deathLocationId',
        label: 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfBurial',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'burialLocationId',
        label: 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'burialPlaceName',
        label: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'dateRanges.typeId',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_TYPE_ID',
        options: data.options.dateRangeType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateRanges.startDate',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_START_DATE',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateRanges.endDate',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_END_DATE',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'dateRanges.centerName',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME',
        options: data.options.dateRangeCenter,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        // parentLocationIdFilter is appended by the component
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'dateRanges',
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_LOCATION',
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'dateRanges.comments',
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_COMMENTS',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_CASE_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_CASE_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_CASE_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_CASE_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_BY',
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
      item: CaseModel,
      classification: IResolverV2ResponseModel<ReferenceDataEntryModel>,
      outcome: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // classification
    if (
      info.item.classification &&
      info.classification.map[info.item.classification]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.CIRCLE,
        color: info.classification.map[info.item.classification].getColorCode(),
        tooltip: this.createViewModifyHelperService.i18nService.instant(info.item.classification)
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

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
   * Return case id mask with data replaced
   */
  generateCaseIDMask(caseIdMask: string): string {
    // validate
    if (_.isEmpty(caseIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return caseIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }
}
