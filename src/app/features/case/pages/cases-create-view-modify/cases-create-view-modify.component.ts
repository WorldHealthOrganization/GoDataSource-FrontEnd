import { Component, OnDestroy } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { AgeModel } from '../../../../core/models/age.model';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { UserModel } from '../../../../core/models/user.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { AddressModel } from '../../../../core/models/address.model';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { CaseCenterDateRangeModel } from '../../../../core/models/case-center-date-range.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';

/**
 * Component
 */
@Component({
  selector: 'app-cases-create-view-modify',
  templateUrl: './cases-create-view-modify.component.html'
})
export class CasesCreateViewModifyComponent extends CreateViewModifyComponent<CaseModel> implements OnDestroy {
  // case visual id mask
  private _caseVisualIDMask: {
    mask: string
  };

  // today
  private _today: Moment = moment();

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected caseDataService: CaseDataService,
    protected translateService: TranslateService,
    protected systemSettingsDataService: SystemSettingsDataService,
    protected toastV2Service: ToastV2Service,
    authDataService: AuthDataService
  ) {
    super(
      activatedRoute,
      authDataService,
      toastV2Service
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): CaseModel {
    return new CaseModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<CaseModel> {
    return this.caseDataService
      .getCase(
        this.selectedOutbreak.id,
        this.activatedRoute.snapshot.params.caseId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // initialize visual ID mask
    this._caseVisualIDMask = {
      mask: CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
    };

    // set visual id for case
    this.itemData.visualId = this._caseVisualIDMask.mask;
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_CASE_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_CASE_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_CASE_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/version']
        }
      }
    ];

    // case list page
    if (CaseModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: {
          link: ['/cases']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_CASE_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_CASE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_CASE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal(),

        // Epidemiology
        this.initializeTabsEpidemiology()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_CASE',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: CaseModel) => {
        // redirect to view
        this.router.navigate([
          '/cases',
          data.id,
          'view'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CREATE_CASE_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
              description: 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  this.itemData.firstName = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'middleName',
              placeholder: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
              description: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  this.itemData.middleName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
              description: 'LNG_CASE_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  this.itemData.lastName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: 'LNG_CASE_FIELD_LABEL_GENDER',
              description: 'LNG_CASE_FIELD_LABEL_GENDER_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.gender,
                set: (value) => {
                  // set gender
                  this.itemData.gender = value;

                  // reset pregnancy ?
                  if (this.itemData.gender === Constants.GENDER_MALE) {
                    this.itemData.pregnancyStatus = undefined;
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
              description: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.pregnancyStatus,
                set: (value) => {
                  this.itemData.pregnancyStatus = value;
                }
              },
              disabled: () => {
                return this.itemData.gender === Constants.GENDER_MALE;
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'occupation',
              placeholder: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
              description: 'LNG_CASE_FIELD_LABEL_OCCUPATION_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
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
              ageChecked: !this.itemData.dob,
              ageTypeYears: this.itemData.age?.months < 1,
              value: {
                age: {
                  years: {
                    get: () => this.itemData.age?.years,
                    set: (value) => {
                      // set value
                      this.itemData.age = this.itemData.age || new AgeModel();
                      this.itemData.age.years = value;
                    }
                  },
                  months: {
                    get: () => this.itemData.age?.months,
                    set: (value) => {
                      // set value
                      this.itemData.age = this.itemData.age || new AgeModel();
                      this.itemData.age.months = value;
                    }
                  }
                },
                dob: {
                  get: () => this.itemData.dob,
                  set: (value) => {
                    this.itemData.dob = value;
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.VISUAL_ID,
              name: 'visualId',
              placeholder: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
              description: this.translateService.instant(
                'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this._caseVisualIDMask
              ),
              value: {
                get: () => this.itemData.visualId,
                set: (value) => {
                  this.itemData.visualId = value;
                }
              },
              validator: new Observable((observer) => {
                // construct cache key
                const cacheKey: string = 'CCA_' + this.selectedOutbreak.id +
                  this._caseVisualIDMask.mask +
                  this.itemData.visualId;

                // get data from cache or execute validator
                TimerCache.run(
                  cacheKey,
                  this.caseDataService.checkCaseVisualIDValidity(
                    this.selectedOutbreak.id,
                    this._caseVisualIDMask.mask,
                    this.itemData.visualId
                  )
                ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                  observer.next(isValid);
                  observer.complete();
                });
              })
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canList(this.authUser),
                html: this.translateService.instant('LNG_PAGE_CREATE_CASE_CANT_SET_RESPONSIBLE_ID_TITLE')
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
            items: this.itemData.documents,
            itemsChanged: (list) => {
              // update documents
              this.itemData.documents = list.items;
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
                typeOptions: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.documents[index];
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
            items: this.itemData.addresses,
            itemsChanged: (list) => {
              // update addresses
              this.itemData.addresses = list.items;
            },
            definition: {
              add: {
                label: 'LNG_ADDRESS_LABEL_ADD_NEW_ADDRESS',
                newItem: () => new AddressModel()
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ADDRESS'
              },
              input: {
                type: CreateViewModifyV2TabInputType.ADDRESS,
                typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.addresses[index];
                  }
                }
              }
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CREATE_CASE_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'classification',
            placeholder: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            description: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this.itemData.classification,
              set: (value) => {
                this.itemData.classification = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfOnset',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET_DESCRIPTION',
            value: {
              get: () => this.itemData.dateOfOnset,
              set: (value) => {
                this.itemData.dateOfOnset = value;
              }
            },
            maxDate: this._today,
            validators: {
              required: () => !!this.selectedOutbreak.isDateOfOnsetRequired,
              dateSameOrBefore: () => [
                this._today,
                'dateOfOutcome'
              ],
              dateSameOrAfter: () => [
                'dateOfInfection'
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'isDateOfOnsetApproximate',
            placeholder: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
            description: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => this.itemData.isDateOfOnsetApproximate,
              set: (value) => {
                this.itemData.isDateOfOnsetApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateBecomeCase',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
            description: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE_DESCRIPTION',
            value: {
              get: () => this.itemData.dateBecomeCase,
              set: (value) => {
                this.itemData.dateBecomeCase = value;
              }
            },
            maxDate: this._today,
            validators: {
              dateSameOrBefore: () => [
                this._today
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfInfection',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION_DESCRIPTION',
            value: {
              get: () => this.itemData.dateOfInfection,
              set: (value) => {
                this.itemData.dateOfInfection = value;
              }
            },
            maxDate: this._today,
            validators: {
              dateSameOrBefore: () => [
                this._today,
                'dateOfOutcome',
                'dateOfOnset'
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: 'LNG_CASE_FIELD_LABEL_OUTCOME',
            description: 'LNG_CASE_FIELD_LABEL_OUTCOME_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this.itemData.outcomeId,
              set: (value) => {
                // set data
                this.itemData.outcomeId = value;

                // reset data if not decease
                if (this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED) {
                  this.itemData.safeBurial = null;
                  this.itemData.dateOfBurial = null;
                  this.itemData.burialLocationId = null;
                  this.itemData.burialPlaceName = null;
                }
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfOutcome',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME_DESCRIPTION',
            value: {
              get: () => this.itemData.dateOfOutcome,
              set: (value) => {
                this.itemData.dateOfOutcome = value;
              }
            },
            maxDate: this._today,
            validators: {
              dateSameOrBefore: () => [
                this._today,
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
            placeholder: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
            description: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED_DESCRIPTION',
            value: {
              get: () => this.itemData.transferRefused,
              set: (value) => {
                this.itemData.transferRefused = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'safeBurial',
            placeholder: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
            description: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL_DESCRIPTION',
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                false :
                this.itemData.safeBurial,
              set: (value) => {
                this.itemData.safeBurial = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfBurial',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL_DESCRIPTION',
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.dateOfBurial,
              set: (value) => {
                this.itemData.dateOfBurial = value;
              }
            },
            maxDate: this._today,
            validators: {
              dateSameOrBefore: () => [
                this._today
              ],
              dateSameOrAfter: () => [
                'dateOfOutcome'
              ]
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.LOCATION_SINGLE,
            name: 'burialLocationId',
            placeholder: 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL',
            description: 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL_DESCRIPTION',
            useOutbreakLocations: true,
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.burialLocationId,
              set: (value) => {
                this.itemData.burialLocationId = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'burialPlaceName',
            placeholder: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
            description: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME_DESCRIPTION',
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.burialPlaceName,
              set: (value) => {
                this.itemData.burialPlaceName = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            value: {
              get: () => this.itemData.dateOfReporting,
              set: (value) => {
                this.itemData.dateOfReporting = value;
              }
            },
            maxDate: this._today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                this._today
              ]
            }
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: 'isDateOfReportingApproximate',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => this.itemData.isDateOfReportingApproximate,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            description: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this.itemData.riskLevel,
              set: (value) => {
                this.itemData.riskLevel = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXTAREA,
            name: 'riskReason',
            placeholder: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
            description: 'LNG_CASE_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            value: {
              get: () => this.itemData.riskReason,
              set: (value) => {
                this.itemData.riskReason = value;
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
            items: this.itemData.vaccinesReceived,
            itemsChanged: (list) => {
              // update documents
              this.itemData.vaccinesReceived = list.items;
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
                vaccineOptions: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                vaccineStatusOptions: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.vaccinesReceived[index];
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
            items: this.itemData.dateRanges,
            itemsChanged: (list) => {
              // update documents
              this.itemData.dateRanges = list.items;
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
                typeOptions: (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                centerOptions: (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.dateRanges[index];
                  }
                },
                startDateValidators: {
                  dateSameOrAfter: () => [
                    'dateOfOnset'
                  ]
                }
              }
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/cases', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/cases', this.itemData?.id, 'modify']
        },
        visible: () => CaseModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/cases']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/cases']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/cases']
        }
      },
      quickActions: {
        options: [
          // Add contact
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_ACTION_ADD_CONTACT',
            action: {
              link: () => ['/contacts', 'create'],
              queryParams: () => {
                return {
                  entityType: EntityType.CASE,
                  entityId: this.itemData?.id
                };
              }
            },
            visible: () => CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          },

          // View Questionnaire
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
            action: {
              link: () => ['/cases', this.itemData.id, 'view-questionnaire']
            }
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER
          },

          // Duplicate records marked as not duplicate
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_SEE_RECORDS_NOT_DUPLICATES',
            action: {
              link: () => ['/duplicated-records', 'cases', this.itemData.id, 'marked-not-duplicates']
            },
            visible: () => CaseModel.canList(this.authUser)
          },

          // contacts
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
            action: {
              link: () => ['/relationships', EntityType.CASE, this.itemData.id, 'contacts']
            },
            visible: () => CaseModel.canListRelationshipContacts(this.authUser)
          },
          // exposures
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
            action: {
              link: () => ['/relationships', EntityType.CASE, this.itemData.id, 'exposures']
            },
            visible: () => CaseModel.canListRelationshipExposures(this.authUser)
          },

          // lab results
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_SEE_LAB_RESULTS',
            action: {
              link: () => ['/lab-results', 'cases', this.itemData.id]
            },
            visible: () => LabResultModel.canList(this.authUser) && CaseModel.canListLabResult(this.authUser)
          },

          // follow-ups
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_FOLLOW_UPS',
            action: {
              link: () => ['/contacts', 'case-related-follow-ups', this.itemData.id]
            },
            visible: () => FollowUpModel.canList(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => CaseModel.canList(this.authUser) || CaseModel.canListRelationshipContacts(this.authUser) ||
              CaseModel.canListRelationshipExposures(this.authUser) || (LabResultModel.canList(this.authUser) && CaseModel.canListLabResult(this.authUser)) ||
              FollowUpModel.canList(this.authUser)
          },

          // movement map
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_MOVEMENT',
            action: {
              link: () => ['/cases', this.itemData.id, 'movement']
            },
            visible: () => CaseModel.canViewMovementMap(this.authUser)
          },

          // chronology chart
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CHRONOLOGY',
            action: {
              link: () => ['/cases', this.itemData.id, 'chronology']
            },
            visible: () => CaseModel.canViewChronologyChart(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => CaseModel.canViewMovementMap(this.authUser) || CaseModel.canViewChronologyChart(this.authUser)
          },

          // Contact group
          {
            type: CreateViewModifyV2MenuType.GROUP,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CASE_WAS_CONTACT_TITLE',
            visible: () => this.itemData.wasContact && (
              this.itemData.hasQuestionnaireAnswersContact ||
              FollowUpModel.canList(this.authUser)
            )
          },
          // case => contact questionnaire
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE',
            action: {
              link: () => ['/cases', this.itemData.id, 'history']
            },
            visible: () => this.itemData.wasContact && this.itemData.hasQuestionnaireAnswersContact
          },
          // case => contact follow-ups
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CONTACT_FOLLOW_UPS',
            action: {
              link: () => ['/contacts', 'case-follow-ups', this.itemData.id]
            },
            visible: () => this.itemData.wasContact && FollowUpModel.canList(this.authUser)
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished
    ) => {
      // create / update
      const runCreateOrUpdate = () => {
        // create / update
        (type === CreateViewModifyV2ActionType.CREATE ?
          this.caseDataService
            .createCase(
              this.selectedOutbreak.id,
              data
            ) :
          this.caseDataService
            .modifyCase(
              this.selectedOutbreak.id,
              this.itemData.id,
              data
            )
        ).pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
          .subscribe((item) => {
            // success creating case
            this.toastV2Service.success('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE');

            // manage duplicates
            // #TODO

            // finished with success
            finished(undefined, item);
          });
      };

      // check if we need to determine duplicates
      this.systemSettingsDataService
        .getAPIVersion()
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // send down
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((versionData) => {
          // no duplicates - proceed to create case ?
          if (
            (
              type === CreateViewModifyV2ActionType.CREATE &&
              versionData.duplicate.disableCaseDuplicateCheck
            ) || (
              type === CreateViewModifyV2ActionType.UPDATE && (
                versionData.duplicate.disableCaseDuplicateCheck || (
                  versionData.duplicate.executeCheckOnlyOnDuplicateDataChange &&
                  !EntityModel.duplicateDataHasChanged(data)
                )
              )
            )
          ) {
            // no need to check for duplicates
            return runCreateOrUpdate();
          }

          // check for duplicates
          this.caseDataService
            .findDuplicates(
              this.selectedOutbreak.id,
              this.isCreate ?
                data : {
                  ...this.itemData,
                  ...data
                }
            )
            .pipe(
              catchError((err) => {
                // specific error
                if (_.includes(_.get(err, 'details.codes.id'), 'uniqueness')) {
                  finished('LNG_PAGE_CREATE_CASE_ERROR_UNIQUE_ID', undefined);
                } else {
                  finished(err, undefined);
                }

                // send down
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((caseDuplicates) => {
              // no duplicates ?
              if (caseDuplicates.duplicates.length < 1) {
                // create case
                return runCreateOrUpdate();
              }

              // construct duplicates dialog input list
              // #TODO

              // display duplicates dialog
              // #TODO
            });
        });
    };
  }
}
