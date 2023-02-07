import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType, CreateViewModifyV2TabInput,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { MapServerModel } from '../../../../core/models/map-server.model';
import * as _ from 'lodash';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { QuestionModel } from '../../../../core/models/question.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

/**
 * Component
 */
@Component({
  selector: 'app-outbreak-create-view-modify',
  templateUrl: './outbreak-create-view-modify.component.html'
})
export class OutbreakCreateViewModifyComponent extends CreateViewModifyComponent<OutbreakModel> implements OnDestroy {
  // used for style url validation
  private _styleUrlValidationCache: {
    [url: string]: Observable<boolean | IGeneralAsyncValidatorResponse>
  } = {};

  /**
   * Constructor
   */
  constructor(
    protected outbreakDataService: OutbreakDataService,
    protected activatedRoute: ActivatedRoute,
    protected translateService: TranslateService,
    protected i18nService: I18nService,
    protected dialogV2Service: DialogV2Service,
    protected router: Router,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService,
      true
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): OutbreakModel {
    return new OutbreakModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: OutbreakModel): Observable<OutbreakModel> {
    return this.outbreakDataService
      .getOutbreak(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.outbreakId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // replace data with template ?
    if (this.isCreate) {
      const outbreakTemplate: OutbreakTemplateModel = this.activatedRoute.snapshot.data.outbreakTemplate;
      if (outbreakTemplate) {
        // delete the id of the outbreak template
        delete outbreakTemplate.id;

        // make the new outbreak which is merged with the outbreak template
        this.itemData = new OutbreakModel(outbreakTemplate);
      }
    }
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_OUTBREAK_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_OUTBREAK_TITLE';
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
            ['/account/my-profile']
        }
      }
    ];

    // case list page
    if (OutbreakModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_OUTBREAKS_TITLE',
        action: {
          link: ['/outbreaks']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_OUTBREAK_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_OUTBREAK_TITLE', {
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
        // Details
        this.initializeTabsDetails(),

        // Map servers
        this.initializeTabsMapServers(),

        // Questionnaires
        this.initializeTabsQuestionnaireCase(),
        this.initializeTabsQuestionnaireContact(),
        this.initializeTabsQuestionnaireFollowUp(),
        this.initializeTabsQuestionnaireLabResult()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: OutbreakModel,
        extraQueryParams: Params
      ) => {
        if (!this.isModify) {
          // redirect to view
          this.router.navigate(
            [
              '/outbreaks',
              data.id,
              'view'
            ], {
              queryParams: extraQueryParams
            }
          );
        }
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_OUTBREAK_TAB_DETAILS' :
        'LNG_PAGE_MODIFY_OUTBREAK_TAB_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_OUTBREAK_TAB_DETAILS' :
            'LNG_PAGE_MODIFY_OUTBREAK_TAB_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'name',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_NAME',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true,
                async: new Observable((observer) => {
                  this.outbreakDataService
                    .checkOutbreakNameUniquenessValidity(
                      this.itemData.name,
                      this.isCreate ?
                        undefined :
                        this.itemData.id
                    )
                    .pipe(
                      catchError((err) => {
                        observer.error(err);
                        observer.complete();

                        // send error down the road
                        return throwError(err);
                      })
                    )
                    .subscribe((response) => {
                      observer.next(response);
                      observer.complete();
                    });
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'disease',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DISEASE_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.disease,
                set: (value) => {
                  this.itemData.disease = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'countries',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.countryIds,
                set: (value) => {
                  this.itemData.countries = value.map((item) => ({ id: item }));
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.LOCATION_MULTIPLE,
              name: 'locationIds',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.locationIds,
                set: (value) => {
                  this.itemData.locationIds = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'startDate',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_START_DATE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_START_DATE_DESCRIPTION',
              value: {
                get: () => this.itemData.startDate,
                set: (value) => {
                  this.itemData.startDate = value;
                }
              },
              validators: {
                required: () => true,
                dateSameOrBefore: () => [
                  'endDate'
                ]
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'endDate',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_END_DATE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_END_DATE_DESCRIPTION',
              value: {
                get: () => this.itemData.endDate,
                set: (value) => {
                  this.itemData.endDate = value;
                }
              },
              validators: {
                dateSameOrAfter: () => [
                  'startDate'
                ]
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'caseIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.caseIdMask,
                set: (value) => {
                  this.itemData.caseIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'contactIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.contactIdMask,
                set: (value) => {
                  this.itemData.contactIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'contactOfContactIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.contactOfContactIdMask,
                set: (value) => {
                  this.itemData.contactOfContactIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'applyGeographicRestrictions',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.applyGeographicRestrictions,
                set: (value) => {
                  this.itemData.applyGeographicRestrictions = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'reportingGeographicalLevelId',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.reportingGeographicalLevelId,
                set: (value) => {
                  this.itemData.reportingGeographicalLevelId = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isContactLabResultsActive',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.isContactLabResultsActive,
                set: (value) => {
                  this.itemData.isContactLabResultsActive = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isDateOfOnsetRequired',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED_DESCRIPTION',
              value: {
                get: () => this.itemData.isDateOfOnsetRequired,
                set: (value) => {
                  this.itemData.isDateOfOnsetRequired = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isContactsOfContactsActive',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_OF_CONTACT_ACTIVE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_OF_CONTACT_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.isContactsOfContactsActive,
                set: (value) => {
                  this.itemData.isContactsOfContactsActive = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'checkLastContactDateAgainstDateOnSet',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET_DESCRIPTION',
              value: {
                get: () => this.itemData.checkLastContactDateAgainstDateOnSet,
                set: (value) => {
                  this.itemData.checkLastContactDateAgainstDateOnSet = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'disableModifyingLegacyQuestionnaire',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE_DESCRIPTION',
              value: {
                get: () => this.itemData.disableModifyingLegacyQuestionnaire,
                set: (value) => {
                  this.itemData.disableModifyingLegacyQuestionnaire = value;
                }
              }
            }
          ]
        },

        // Generate follow-ups
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOW_UP',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'generateFollowUpsTeamAssignmentAlgorithm',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.generateFollowUpsTeamAssignmentAlgorithm,
                set: (value) => {
                  this.itemData.generateFollowUpsTeamAssignmentAlgorithm = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsOverwriteExisting',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsOverwriteExisting,
                set: (value) => {
                  this.itemData.generateFollowUpsOverwriteExisting = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsKeepTeamAssignment',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsKeepTeamAssignment,
                set: (value) => {
                  this.itemData.generateFollowUpsKeepTeamAssignment = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'periodOfFollowup',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS_DESCRIPTION',
              value: {
                get: () => this.itemData.periodOfFollowup,
                set: (value) => {
                  this.itemData.periodOfFollowup = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'frequencyOfFollowUpPerDay',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY_DESCRIPTION',
              value: {
                get: () => this.itemData.frequencyOfFollowUpPerDay,
                set: (value) => {
                  this.itemData.frequencyOfFollowUpPerDay = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'intervalOfFollowUp',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS_DESCRIPTION',
              value: {
                get: () => this.itemData.intervalOfFollowUp,
                set: (value) => {
                  this.itemData.intervalOfFollowUp = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^\\s*([1-9][0-9]*)(\\s*,\\s*([1-9][0-9]*))*$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsDateOfLastContact',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsDateOfLastContact,
                set: (value) => {
                  this.itemData.generateFollowUpsDateOfLastContact = value;
                }
              }
            }
          ]
        },

        // Reports
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_OUTBREAK_FIELD_LABEL_REPORT',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noDaysAmongContacts',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS_DESCRIPTION',
              value: {
                get: () => this.itemData.noDaysAmongContacts,
                set: (value) => {
                  this.itemData.noDaysAmongContacts = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noDaysInChains',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS_DESCRIPTION',
              value: {
                get: () => this.itemData.noDaysInChains,
                set: (value) => {
                  this.itemData.noDaysInChains = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noDaysNotSeen',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NOT_SEEN',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NOT_SEEN_DESCRIPTION',
              value: {
                get: () => this.itemData.noDaysNotSeen,
                set: (value) => {
                  this.itemData.noDaysNotSeen = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noLessContacts',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_LESS_THAN_X_CONTACTS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_LESS_THAN_X_CONTACTS_DESCRIPTION',
              value: {
                get: () => this.itemData.noLessContacts,
                set: (value) => {
                  this.itemData.noLessContacts = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'longPeriodsBetweenCaseOnset',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_LONG_PERIODS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_LONG_PERIODS_DESCRIPTION',
              value: {
                get: () => this.itemData.longPeriodsBetweenCaseOnset,
                set: (value) => {
                  this.itemData.longPeriodsBetweenCaseOnset = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noDaysNewContacts',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT_DESCRIPTION',
              value: {
                get: () => this.itemData.noDaysNewContacts,
                set: (value) => {
                  this.itemData.noDaysNewContacts = value;
                }
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Map servers
   */
  private initializeTabsMapServers(): ICreateViewModifyV2Tab {
    // inputs
    const inputs: CreateViewModifyV2TabInput[] = [];

    // details
    if (this.isCreate) {
      inputs.push({
        // move to legend
        type: CreateViewModifyV2TabInputType.LABEL,
        value: {
          get: () => 'LNG_PAGE_CREATE_OUTBREAK_TAB_MAP_SERVERS_DETAILS'
        }
      });
    }

    // rest of inputs
    inputs.push({
      type: CreateViewModifyV2TabInputType.LIST,
      name: 'arcGisServers',
      items: this.itemData.arcGisServers,
      sortable: true,
      itemsChanged: (list) => {
        // update
        this.itemData.arcGisServers = list.items;
      },
      definition: {
        add: {
          label: 'LNG_INPUT_LABEL_ADD_ITEM',
          newItem: () => new MapServerModel()
        },
        remove: {
          label: 'LNG_COMMON_BUTTON_DELETE',
          confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ITEM'
        },
        input: {
          type: CreateViewModifyV2TabInputType.MAP_SERVER,
          vectorTypeOptions: (this.activatedRoute.snapshot.data.mapVectorType as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          styleSourceOptions: {},
          value: {
            get: (index: number) => {
              return this.itemData.arcGisServers[index];
            }
          },
          styleAsyncValidator: (input, itemIndex) => {
            // determine url
            const url: string = this.itemData.arcGisServers[itemIndex].styleUrl;

            // need to initialize url validation ?
            const cacheKey: string = `${itemIndex}_${url}`;
            if (this._styleUrlValidationCache[cacheKey] === undefined) {
              this._styleUrlValidationCache[cacheKey] = new Observable((finishedObs) => {
                // not a valid url ?
                if (!(/https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})(.*)/i.test(url))) {
                  // not a valid url
                  finishedObs.next({
                    isValid: false,
                    errMsg: 'LNG_PAGE_CREATE_OUTBREAK_MAP_SERVER_STYLE_INVALID_URL'
                  });
                  finishedObs.complete();

                  // finished
                  return;
                }

                // try to fetch sources
                fetch(url)
                  .then(r => r.json())
                  .then((glStyle: {
                    sources: {
                      [name: string]: any
                    }
                  }) => {
                    // did we retrieve the response looking to something similar to what we're expecting ?
                    if (
                      !glStyle ||
                      !glStyle.sources ||
                      !_.isObject(glStyle.sources)
                    ) {
                      // not a valid url
                      finishedObs.next({
                        isValid: false,
                        errMsg: 'LNG_PAGE_CREATE_OUTBREAK_MAP_SERVER_STYLE_INVALID_URL_RESPONSE'
                      });
                      finishedObs.complete();

                      // finished
                      return;
                    }

                    // set style options
                    input.styleSourceOptions[url] = [];
                    Object.keys(glStyle.sources).forEach((source: string) => {
                      input.styleSourceOptions[url].push({
                        label: source,
                        value: source
                      });
                    });

                    // select the first source
                    this.itemData.arcGisServers[itemIndex].styleUrlSource = input.styleSourceOptions[url].length < 1 ?
                      undefined : (
                        this.itemData.arcGisServers[itemIndex].styleUrlSource ?
                          (
                            glStyle.sources[this.itemData.arcGisServers[itemIndex].styleUrlSource] ?
                              this.itemData.arcGisServers[itemIndex].styleUrlSource :
                              input.styleSourceOptions[url][0].value
                          ) :
                          input.styleSourceOptions[url][0].value
                      );

                    // sources retrieved
                    finishedObs.next(true);
                    finishedObs.complete();
                  })
                  .catch(() => {
                    finishedObs.next({
                      isValid: false,
                      errMsg: 'LNG_PAGE_CREATE_OUTBREAK_MAP_SERVER_STYLE_INVALID_URL_RESPONSE'
                    });
                    finishedObs.complete();
                  });
              });
            }

            // finished
            return this._styleUrlValidationCache[cacheKey];
          }
        }
      }
    });

    // finished
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'map_servers',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_OUTBREAK_TAB_MAP_SERVERS' :
        'LNG_PAGE_MODIFY_OUTBREAK_TAB_MAP_SERVERS',
      sections: [
        // Servers
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_OUTBREAK_TAB_MAP_SERVERS' :
            'LNG_PAGE_MODIFY_OUTBREAK_TAB_MAP_SERVERS',
          inputs
        }
      ]
    };
  }

  /**
   * Initialize tabs - Questionnaire - Case
   */
  private initializeTabsQuestionnaireCase(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'case_investigation_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_EDIT_QUESTIONNAIRE,
        name: 'caseInvestigationTemplate',
        value: {
          get: () => this.itemData.caseInvestigationTemplate,
          set: (value) => {
            this.itemData.caseInvestigationTemplate = value;
          }
        }
      },
      visible: () => this.isView ?
        true :
        OutbreakModel.canModifyCaseQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Questionnaire - Contact
   */
  private initializeTabsQuestionnaireContact(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'contact_investigation_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_EDIT_QUESTIONNAIRE,
        name: 'contactInvestigationTemplate',
        value: {
          get: () => this.itemData.contactInvestigationTemplate,
          set: (value) => {
            this.itemData.contactInvestigationTemplate = value;
          }
        }
      },
      visible: () => this.isView ?
        true :
        OutbreakModel.canModifyContactQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Questionnaire - FollowUp
   */
  private initializeTabsQuestionnaireFollowUp(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'follow_up_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_EDIT_QUESTIONNAIRE,
        name: 'contactFollowUpTemplate',
        value: {
          get: () => this.itemData.contactFollowUpTemplate,
          set: (value) => {
            this.itemData.contactFollowUpTemplate = value;
          }
        }
      },
      visible: () => this.isView ?
        true :
        OutbreakModel.canModifyContactFollowUpQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Questionnaire - Lab result
   */
  private initializeTabsQuestionnaireLabResult(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'lab_result_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_EDIT_QUESTIONNAIRE,
        name: 'labResultsTemplate',
        value: {
          get: () => this.itemData.labResultsTemplate,
          set: (value) => {
            this.itemData.labResultsTemplate = value;
          }
        }
      },
      visible: () => this.isView ?
        true :
        OutbreakModel.canModifyCaseLabResultQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/outbreaks', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/outbreaks', this.itemData?.id, 'modify']
        },
        visible: () => OutbreakModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_OUTBREAK_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_OUTBREAK_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            }
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
      // sanitize questionnaire - case
      // - remove fields used by ui (e.g. collapsed...)
      if (data.caseInvestigationTemplate) {
        data.caseInvestigationTemplate = (data.caseInvestigationTemplate || []).map((question) => new QuestionModel(question));
      }

      // sanitize questionnaire - contact
      // - remove fields used by ui (e.g. collapsed...)
      if (data.contactInvestigationTemplate) {
        data.contactInvestigationTemplate = (data.contactInvestigationTemplate || []).map((question) => new QuestionModel(question));
      }

      // sanitize questionnaire - follow-up
      // - remove fields used by ui (e.g. collapsed...)
      if (data.contactFollowUpTemplate) {
        data.contactFollowUpTemplate = (data.contactFollowUpTemplate || []).map((question) => new QuestionModel(question));
      }

      // sanitize questionnaire - lab result
      // - remove fields used by ui (e.g. collapsed...)
      if (data.labResultsTemplate) {
        data.labResultsTemplate = (data.labResultsTemplate || []).map((question) => new QuestionModel(question));
      }

      // cleanup
      delete data._countryIds;
      delete data._countries;
      if (data.countries) {
        data.countries = data.countries.map((item) => ({
          id: item
        }));
      }

      // create / modify
      (
        type === CreateViewModifyV2ActionType.CREATE ?
          this.outbreakDataService.createOutbreak(data) :
          this.outbreakDataService.modifyOutbreak(
            this.itemData.id,
            data
          )
      ).pipe(
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        })
      ).subscribe((outbreak) => {
        // refresh list of top nav outbreaks
        TopnavComponent.REFRESH_OUTBREAK_LIST();

        // no need to update language ?
        if (
          !data.caseInvestigationTemplate &&
          !data.contactInvestigationTemplate &&
          !data.contactFollowUpTemplate &&
          !data.labResultsTemplate
        ) {
          // display message
          this.toastV2Service.success(
            type === CreateViewModifyV2ActionType.CREATE ?
              'LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON' :
              'LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE'
          );

          // hide loading & redirect
          finished(undefined, outbreak);

          // finished
          return;
        }

        // update language tokens to get the translation of submitted questions and answers
        this.i18nService.loadUserLanguage()
          .pipe(
            catchError((err) => {
              // show err
              this.toastV2Service.error(err);

              // finished
              finished(err, undefined);

              // send further
              return throwError(err);
            })
          )
          .subscribe(() => {
            // display message
            this.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON' :
                'LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE'
            );

            // hide loading & redirect
            finished(undefined, outbreak);
          });
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: OutbreakModel) => ['/outbreaks', item.id, 'view'],
      get: {
        text: (item: OutbreakModel) => item.name
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = OutbreakModel.generateAdvancedFilters({
      options: {
        disease: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        country: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        geographicalLevel: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        followUpGenerationTeamAssignmentAlgorithm: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.outbreakDataService
      .getOutbreaksList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
