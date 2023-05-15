import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ActionType, CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { QuestionModel } from '../../../../core/models/question.model';
import {
  ITreeEditorDataCategory, ITreeEditorDataValue
} from '../../../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { IconModel } from '../../../../core/models/icon.model';
import {
  IV2BottomDialogConfigButtonType
} from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import * as _ from 'lodash';

/**
 * Component
 */
@Component({
  selector: 'app-outbreak-template-create-view-modify',
  templateUrl: './outbreak-template-create-view-modify.component.html'
})
export class OutbreakTemplateCreateViewModifyComponent extends CreateViewModifyComponent<OutbreakTemplateModel> implements OnDestroy {
  // static
  private static readonly TAB_NAMES_REF_DATA: string = 'ref_data_per_outbreak_template';

  // per disease
  private _diseaseSpecificReferenceData: ITreeEditorDataCategory[];

  /**
   * Constructor
   */
  constructor(
    private outbreakTemplateDataService: OutbreakTemplateDataService,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private router: Router,
    protected referenceDataHelperService: ReferenceDataHelperService,
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
  protected createNewItem(): OutbreakTemplateModel {
    return new OutbreakTemplateModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: OutbreakTemplateModel): Observable<OutbreakTemplateModel> {
    return this.outbreakTemplateDataService
      .getOutbreakTemplate(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.outbreakTemplateId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // format reference data per disease to expected tree format
    this._diseaseSpecificReferenceData = this.referenceDataHelperService.convertRefCategoriesToTreeCategories(this.activatedRoute.snapshot.data.diseaseSpecificCategories.list);
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_OUTBREAK_TEMPLATE_TITLE';
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
    if (OutbreakTemplateModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE',
        action: {
          link: ['/outbreak-templates']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_OUTBREAK_TEMPLATE_TITLE', {
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

        // Reference Data Per Outbreak Template
        this.initializeTabsReferenceDataPerOutbreakTemplate(),

        // Questionnaires
        this.initializeTabsQuestionnaireCase(),
        this.initializeTabsQuestionnaireContact(),
        this.initializeTabsQuestionnaireFollowUp(),
        this.initializeTabsQuestionnaireLabResult()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_ACTION_CREATE_OUTBREAK_BUTTON'),
          message: () => this.i18nService.instant(
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
        data: OutbreakTemplateModel,
        extraQueryParams: Params
      ) => {
        if (!this.isModify) {
          // redirect to view
          this.router.navigate(
            [
              '/outbreak-templates',
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
        'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TAB_DETAILS' :
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_TAB_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TAB_DETAILS' :
            'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_TAB_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'name',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_NAME',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true,
                async: new Observable((observer) => {
                  this.outbreakTemplateDataService
                    .checkOutbreakTemplateNameUniquenessValidity(
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISEASE',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISEASE_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.disease,
                set: (value) => {
                  // set value
                  this.itemData.disease = value;

                  // nothing to do ?
                  if (
                    !value ||
                    !(this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[value] ||
                    _.isEmpty((this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[value].allowedRefDataItems)
                  ) {
                    return;
                  }

                  // replace existing ref data per outbreak with the ones from the disease ?
                  this.showCopyDiseaseAllowedRefDataConfirmation();
                }
              },
              suffixIconButtons: [
                {
                  icon: 'file_copy',
                  tooltip: 'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_COPY_REF_FROM_DISEASE_TOOLTIP',
                  disabled: () => {
                    // check if we have anything to copy
                    const allowedRefDataItems: ITreeEditorDataValue = this.itemData.disease ?
                      (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[this.itemData.disease]?.allowedRefDataItems :
                      undefined;
                    if (
                      !allowedRefDataItems ||
                      Object.keys(allowedRefDataItems).length < 1
                    ) {
                      return true;
                    }

                    // allow
                    return false;
                  },
                  clickAction: () => {
                    this.showCopyDiseaseAllowedRefDataConfirmation();
                  }
                }
              ]
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'applyGeographicRestrictions',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.applyGeographicRestrictions,
                set: (value) => {
                  this.itemData.applyGeographicRestrictions = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isContactLabResultsActive',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_LAB_RESULTS_ACTIVE',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_LAB_RESULTS_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.isContactLabResultsActive,
                set: (value) => {
                  this.itemData.isContactLabResultsActive = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isDateOfOnsetRequired',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED_DESCRIPTION',
              value: {
                get: () => this.itemData.isDateOfOnsetRequired,
                set: (value) => {
                  this.itemData.isDateOfOnsetRequired = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isContactsOfContactsActive',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_OF_CONTACT_ACTIVE',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_OF_CONTACT_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.isContactsOfContactsActive,
                set: (value) => {
                  this.itemData.isContactsOfContactsActive = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'checkLastContactDateAgainstDateOnSet',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET_DESCRIPTION',
              value: {
                get: () => this.itemData.checkLastContactDateAgainstDateOnSet,
                set: (value) => {
                  this.itemData.checkLastContactDateAgainstDateOnSet = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'disableModifyingLegacyQuestionnaire',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE_DESCRIPTION',
              value: {
                get: () => this.itemData.disableModifyingLegacyQuestionnaire,
                set: (value) => {
                  this.itemData.disableModifyingLegacyQuestionnaire = value;
                }
              }
            }
          ]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOW_UP',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'generateFollowUpsTeamAssignmentAlgorithm',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsOverwriteExisting,
                set: (value) => {
                  this.itemData.generateFollowUpsOverwriteExisting = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsKeepTeamAssignment',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsKeepTeamAssignment,
                set: (value) => {
                  this.itemData.generateFollowUpsKeepTeamAssignment = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'periodOfFollowup',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DURATION_FOLLOWUP_DAYS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsDateOfLastContact,
                set: (value) => {
                  this.itemData.generateFollowUpsDateOfLastContact = value;
                }
              }
            }
          ]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_REPORT',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'noDaysAmongContacts',
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NOT_SEEN',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NOT_SEEN_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_LESS_THAN_X_CONTACTS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_LESS_THAN_X_CONTACTS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_LONG_PERIODS',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_LONG_PERIODS_DESCRIPTION',
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
              placeholder: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NEW_CONTACT',
              description: () => 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NEW_CONTACT_DESCRIPTION',
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
   * Initialize tabs - Reference data per outbreak template
   */
  private initializeTabsReferenceDataPerOutbreakTemplate(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: OutbreakTemplateCreateViewModifyComponent.TAB_NAMES_REF_DATA,
      label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_ALLOWED_REF_DATA_ITEMS',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_TREE_EDITOR,
        name: 'allowedRefDataItems',
        displaySystemWide: true,
        options: this._diseaseSpecificReferenceData,
        value: {
          get: () => this.itemData.allowedRefDataItems,
          set: (value) => {
            this.itemData.allowedRefDataItems = value;
          }
        },
        add: {
          callback: (data) => {
            this.referenceDataHelperService
              .showNewItemDialog(
                {
                  icon: (this.activatedRoute.snapshot.data.icon as IResolverV2ResponseModel<IconModel>).options
                },
                data.category,
                (
                  item,
                  addAnother
                ) => {
                  data.finish(
                    item ?
                      {
                        id: item.id,
                        label: item.value,
                        order: item.order,
                        disabled: !item.active,
                        colorCode: item.colorCode,
                        isSystemWide: !!item.isSystemWide,
                        iconUrl: item.iconUrl
                      } :
                      null,
                    addAnother
                  );
                }
              );
          },
          visible: () => ReferenceDataEntryModel.canCreate(this.authUser)
        }
      }
    };
  }

  /**
   * Initialize tabs - Case Questionnaire
   */
  private initializeTabsQuestionnaireCase(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'case_investigation_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
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
        OutbreakTemplateModel.canModifyCaseQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Contact Questionnaire
   */
  private initializeTabsQuestionnaireContact(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'contact_investigation_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE',
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
        OutbreakTemplateModel.canModifyContactQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Follow Up Questionnaire
   */
  private initializeTabsQuestionnaireFollowUp(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'follow_up_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
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
        OutbreakTemplateModel.canModifyContactFollowUpQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize tabs - Lab Results Questionnaire
   */
  private initializeTabsQuestionnaireLabResult(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'lab_result_template',
      label: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
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
        OutbreakTemplateModel.canModifyCaseLabResultQuestionnaire(this.authUser)
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/outbreak-templates', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/outbreak-templates', this.itemData?.id, 'modify']
        },
        visible: () => OutbreakTemplateModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/outbreak-templates']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/outbreak-templates']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/outbreak-templates']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            }
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => OutbreakTemplateModel.canGenerateOutbreak(this.authUser)
          },

          // Generate Outbreak
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_GENERATE_OUTBREAK',
            action: {
              link: () => ['/outbreaks', 'create'],
              queryParams: () => ({
                outbreakTemplateId: this.itemData.id
              })
            },
            visible: () => OutbreakTemplateModel.canGenerateOutbreak(this.authUser)
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

      // create / modify
      (
        type === CreateViewModifyV2ActionType.CREATE ?
          this.outbreakTemplateDataService.createOutbreakTemplate(data) :
          this.outbreakTemplateDataService.modifyOutbreakTemplate(
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
      ).subscribe((outbreakTemplate) => {
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
              'LNG_PAGE_CREATE_OUTBREAK_TEMPLATES_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON' :
              'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE'
          );

          // hide loading & redirect
          finished(undefined, outbreakTemplate);

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
                'LNG_PAGE_CREATE_OUTBREAK_TEMPLATES_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON' :
                'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE'
            );

            // hide loading & redirect
            finished(undefined, outbreakTemplate);
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
      link: (item: OutbreakTemplateModel) => ['/outbreak-templates', item.id, 'view'],
      get: {
        text: (item: OutbreakTemplateModel) => item.name
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
    this.expandListAdvancedFilters = OutbreakTemplateModel.generateAdvancedFilters({
      options: {
        disease: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
    this.expandListRecords$ = this.outbreakTemplateDataService
      .getOutbreakTemplatesList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Copy disease allowed ref data to outbreak template
   */
  private showCopyDiseaseAllowedRefDataConfirmation(): void {
    // ask for confirmation before overwriting
    this.dialogV2Service.showConfirmDialog({
      config: {
        title: {
          get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
        },
        message: {
          get: () => 'LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_COPY_REF_FROM_DISEASE_DIALOG',
          data: () => ({
            disease: this.i18nService.instant(this.itemData.disease)
          })
        }
      },
      cancelLabel: 'LNG_COMMON_LABEL_NO'
    }).subscribe((response) => {
      // canceled ?
      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
        // finished
        return;
      }

      // overwrite
      const allowedRefDataItems: ITreeEditorDataValue = (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[this.itemData.disease]?.allowedRefDataItems;
      this.itemData.allowedRefDataItems = _.cloneDeep(allowedRefDataItems);

      // mark dirty the reference data input and not the current input
      this.createViewModifyComponent.tabData.tabs
        .find((tab) => tab.name === OutbreakTemplateCreateViewModifyComponent.TAB_NAMES_REF_DATA)
        ?.form
        ?.controls
        ?.allowedRefDataItems?.markAsDirty();
    });
  }
}
