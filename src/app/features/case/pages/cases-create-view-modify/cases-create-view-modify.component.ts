import { Component, OnDestroy } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { Observable } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateViewModifyV2Tab, CreateViewModifyV2TabInputType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { AgeModel } from '../../../../core/models/age.model';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { UserModel } from '../../../../core/models/user.model';

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

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected caseDataService: CaseDataService,
    protected translateService: TranslateService,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service
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
    this.tabs = [
      // Personal
      this.initializeTabsPersonal(),

      // Epidemiology
      this.initializeTabsEpidemiology()
    ];
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): CreateViewModifyV2Tab {
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
            items: [],
            definition: {
              add: {
                label: 'LNG_DOCUMENT_LABEL_ADD_NEW_DOCUMENT',
                newItem: () => new CaseModel()
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT'
              },
              inputs: [{
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'type',
                placeholder: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
                description: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE_DESCRIPTION',
                options: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  // #TODO
                  get: () => null,
                  set: () => {}
                }
              }, {
                type: CreateViewModifyV2TabInputType.TEXT,
                name: 'number',
                placeholder: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER',
                description: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER_DESCRIPTION',
                value: {
                  // #TODO
                  get: () => null,
                  set: () => {}
                }
              }]
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): CreateViewModifyV2Tab {
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
            }
          }]
        }
      ]
    };
  }
}
