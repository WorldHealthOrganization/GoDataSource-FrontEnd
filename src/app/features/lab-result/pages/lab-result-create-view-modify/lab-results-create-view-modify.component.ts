import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { Observable, throwError } from 'rxjs';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { moment } from '../../../../core/helperClasses/x-moment';

/**
 * Component
 */
@Component({
  selector: 'app-lab-results-create-view-modify',
  templateUrl: './lab-results-create-view-modify.component.html'
})
export class LabResultsCreateViewModifyComponent extends CreateViewModifyComponent<LabResultModel> implements OnDestroy {
  // data
  entityData: CaseModel | ContactModel;
  private _personType: EntityType;

  // constants
  EntityType = EntityType;

  /**
   * Constructor
   */
  constructor(
    private labResultDataService: LabResultDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private dialogV2Service: DialogV2Service,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService,
      true
    );

    // get data
    this._personType = this.activatedRoute.snapshot.data.personType;
    this.entityData = this.activatedRoute.snapshot.data.entityData;
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
  protected createNewItem(): LabResultModel {
    return new LabResultModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: LabResultModel): Observable<LabResultModel> {
    return this.labResultDataService
      .getOutbreakLabResult(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.labResultId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_LAB_RESULT_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_LAB_RESULT_TITLE';
      this.pageTitleData = {
        sampleIdentifier: this.itemData.sampleIdentifier ?
          this.itemData.sampleIdentifier :
          '—'
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_LAB_RESULT_TITLE';
      this.pageTitleData = {
        sampleIdentifier: this.itemData.sampleIdentifier ?
          this.itemData.sampleIdentifier :
          '—'
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset
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

    // lab results list
    if (LabResultModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
          action: {
            link: ['/lab-results']
          }
        }
      );
    }

    // entity list
    if (
      this._personType === EntityType.CONTACT &&
      ContactModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        }
      );
    } else if (
      this._personType === EntityType.CASE &&
      CaseModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        }
      );
    }

    // person breadcrumbs
    if (this.entityData) {
      // entity view
      if (
        this._personType === EntityType.CONTACT &&
        ContactModel.canView(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: this.entityData.name,
            action: this.entityData.deleted ? null : {
              link: [`/contacts/${this.entityData.id}/view`]
            }
          }
        );
      } else if (
        this._personType === EntityType.CASE &&
        CaseModel.canView(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: this.entityData.name,
            action: this.entityData.deleted ? null : {
              link: [`/cases/${this.entityData.id}/view`]
            }
          }
        );
      }

      // lab result list
      if (
        this._personType === EntityType.CONTACT &&
        ContactModel.canListLabResult(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: `${this.translateService.instant(this.entityData.name)} ${this.translateService.instant('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE')}`,
            action: this.entityData.deleted ? null : {
              link: [`/lab-results/contacts/${this.entityData.id}`]
            }
          }
        );
      } else if (
        this._personType === EntityType.CASE &&
        CaseModel.canListLabResult(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: `${this.translateService.instant(this.entityData.name)} ${this.translateService.instant('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE')}`,
            action: this.entityData.deleted ? null : {
              link: [`/lab-results/cases/${this.entityData.id}`]
            }
          }
        );
      }
    }

    // current page
    if (this.isCreate) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_CREATE_LAB_RESULT_TITLE',
          action: null
        }
      );
    } else if (this.isModify) {
      this.breadcrumbs.push(
        {
          label: this.translateService.instant(
            'LNG_PAGE_MODIFY_LAB_RESULT_TITLE',
            {
              sampleIdentifier: this.itemData.sampleIdentifier ?
                this.itemData.sampleIdentifier :
                '—'
            }
          ),
          action: null
        }
      );
    } else {
      // view
      this.breadcrumbs.push(
        {
          label: this.translateService.instant(
            'LNG_PAGE_VIEW_LAB_RESULT_TITLE',
            {
              sampleIdentifier: this.itemData.sampleIdentifier ?
                this.itemData.sampleIdentifier :
                '—'
            }
          ),
          action: null
        }
      );
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
        this.initializeTabsDetails(),

        // Questionnaires
        this.initializeTabsQuestionnaire()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_LAB_RESULT_ACTION_CREATE_LAB_RESULT_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.entityData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: LabResultModel) => {
        // redirect to view
        if (this._personType === EntityType.CASE) {
          this.redirectService.to([
            `/lab-results/cases/${this.entityData.id}/${data.id}/view`
          ]);
        } else if (this._personType === EntityType.CONTACT) {
          this.redirectService.to([
            `/lab-results/contacts/${this.entityData.id}/${data.id}/view`
          ]);
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
      label: this.isCreate ? 'LNG_PAGE_CREATE_LAB_RESULT_TAB_DETAILS' : 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
      sections: [
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ? 'LNG_PAGE_CREATE_LAB_RESULT_TAB_DETAILS' : 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'sampleIdentifier',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID_DESCRIPTION',
              value: {
                get: () => this.itemData.sampleIdentifier,
                set: (value) => {
                  // set data
                  this.itemData.sampleIdentifier = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateSampleTaken',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN_DESCRIPTION',
              value: {
                get: () => this.itemData.dateSampleTaken,
                set: (value) => {
                  this.itemData.dateSampleTaken = value;
                }
              },
              validators: {
                required: () => true,
                dateSameOrBefore: () => [
                  'dateSampleDelivered',
                  'dateTesting',
                  'dateOfResult'
                ]
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateSampleDelivered',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED_DESCRIPTION',
              value: {
                get: () => this.itemData.dateSampleDelivered,
                set: (value) => {
                  this.itemData.dateSampleDelivered = value;
                }
              },
              validators: {
                dateSameOrBefore: () => [
                  'dateTesting',
                  'dateOfResult'
                ],
                dateSameOrAfter: () => [
                  'dateSampleTaken'
                ]
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateTesting',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING_DESCRIPTION',
              value: {
                get: () => this.itemData.dateTesting,
                set: (value) => {
                  this.itemData.dateTesting = value;
                }
              },
              validators: {
                dateSameOrBefore: () => [
                  'dateOfResult'
                ],
                dateSameOrAfter: () => [
                  'dateSampleDelivered',
                  'dateSampleTaken'
                ]
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateOfResult',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT_DESCRIPTION',
              value: {
                get: () => this.itemData.dateOfResult,
                set: (value) => {
                  this.itemData.dateOfResult = value;
                }
              },
              validators: {
                dateSameOrAfter: () => [
                  'dateTesting',
                  'dateSampleDelivered',
                  'dateSampleTaken'
                ]
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'labName',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.labName,
                set: (value) => {
                  this.itemData.labName = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'sampleType',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.sampleType,
                set: (value) => {
                  this.itemData.sampleType = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'testType',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.testType,
                set: (value) => {
                  this.itemData.testType = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'result',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.result,
                set: (value) => {
                  this.itemData.result = value;
                }
              },
              validators: {
                required: () => this.itemData.status === Constants.PROGRESS_OPTIONS.COMPLETED.value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'testedFor',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR_DESCRIPTION',
              value: {
                get: () => this.itemData.testedFor,
                set: (value) => {
                  // set data
                  this.itemData.testedFor = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'status',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.status,
                set: (value) => {
                  this.itemData.status = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'quantitativeResult',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT_DESCRIPTION',
              value: {
                get: () => this.itemData.quantitativeResult,
                set: (value) => {
                  this.itemData.quantitativeResult = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'notes',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_NOTES_DESCRIPTION',
              value: {
                get: () => this.itemData.notes,
                set: (value) => {
                  this.itemData.notes = value;
                }
              }
            }
          ]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'sequence[hasSequence]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.hasSequence,
                set: (value) => {
                  // set value
                  this.itemData.sequence.hasSequence = value;

                  // reset data
                  if (this.itemData.sequence.hasSequence) {
                    this.itemData.sequence.noSequenceReason = undefined;
                  } else {
                    this.itemData.sequence.dateSampleSent = undefined;
                    this.itemData.sequence.labId = undefined;
                    this.itemData.sequence.dateResult = undefined;
                    this.itemData.sequence.resultId = undefined;
                  }
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'sequence[dateSampleSent]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.dateSampleSent,
                set: (value) => {
                  this.itemData.sequence.dateSampleSent = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'sequence[labId]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.sequence.labId,
                set: (value) => {
                  this.itemData.sequence.labId = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'sequence[dateResult]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.dateResult,
                set: (value) => {
                  this.itemData.sequence.dateResult = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'sequence[resultId]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.sequence.resultId,
                set: (value) => {
                  this.itemData.sequence.resultId = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'sequence[noSequenceReason]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.noSequenceReason,
                set: (value) => {
                  this.itemData.sequence.noSequenceReason = value;
                }
              },
              disabled: () => this.itemData.sequence.hasSequence
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Questionnaire
   */
  private initializeTabsQuestionnaire(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.labResultsTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: (value) => {
            this.itemData.questionnaireAnswers = value;
          }
        },
        updateErrors: (errorsHTML) => {
          errors = errorsHTML;
        }
      },
      invalidHTMLSuffix: () => {
        return errors;
      },
      visible: () => this.selectedOutbreak.labResultsTemplate?.length > 0
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => {
            if (this._personType === EntityType.CASE &&
              CaseModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/cases/${this.entityData.id}/${this.itemData?.id}/view`];
            } else if (this._personType === EntityType.CONTACT &&
              ContactModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/contacts/${this.entityData.id}/${this.itemData?.id}/view`];
            }
          }
        }
      },
      modify: {
        link: {
          link: () => {
            if (this._personType === EntityType.CASE &&
              CaseModel.canModifyLabResult(this.authUser)) {
              return [`/lab-results/cases/${this.entityData.id}/${this.itemData?.id}/modify`];
            } else if (this._personType === EntityType.CONTACT &&
              ContactModel.canModifyLabResult(this.authUser)) {
              return [`/lab-results/contacts/${this.entityData.id}/${this.itemData?.id}/modify`];
            }
          }
        },
        visible: () => {
          if (!this.selectedOutbreakIsActive) {
            return false;
          }
          if (this._personType === EntityType.CASE) {
            return CaseModel.canModifyLabResult(this.authUser);
          } else if (this._personType === EntityType.CONTACT) {
            return ContactModel.canModifyLabResult(this.authUser);
          } else {
            return false;
          }
        }
      },
      createCancel: {
        link: {
          link: () => {
            if (this._personType === EntityType.CASE &&
              CaseModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/cases/${this.entityData.id}/${this.itemData?.id}/view`];
            } else if (this._personType === EntityType.CONTACT &&
              ContactModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/contacts/${this.entityData.id}/${this.itemData?.id}/view`];
            }
          }
        }
      },
      viewCancel: {
        link: {
          link: () => {
            if (this._personType === EntityType.CASE &&
              CaseModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/cases/${this.entityData.id}`];
            } else if (this._personType === EntityType.CONTACT &&
              ContactModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/contacts/${this.entityData.id}`];
            }
          }
        }
      },
      modifyCancel: {
        link: {
          link: () => {
            if (this._personType === EntityType.CASE &&
              CaseModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/cases/${this.entityData.id}/${this.itemData?.id}/view`];
            } else if (this._personType === EntityType.CONTACT &&
              ContactModel.canViewLabResult(this.authUser)) {
              return [`/lab-results/contacts/${this.entityData.id}/${this.itemData?.id}/view`];
            }
          }
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
            },
            visible: () => !this.isCreate
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
      // append variant / strain data
      if (data.sequence) {
        data.sequence = Object.assign(
          {},
          this.itemData.sequence,
          data.sequence
        );
      }

      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.labResultDataService.createLabResult(
          this.selectedOutbreak.id,
          EntityModel.getLinkForEntityType(this._personType),
          this.entityData.id,
          data
        ) :
        this.labResultDataService
          .modifyLabResult(
            this.selectedOutbreak.id,
            this.itemData.id,
            data,
            true
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
      ).subscribe((item: LabResultModel) => {
        // success creating / updating event
        this.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_LAB_RESULT_ACTION_CREATE_LAB_RESULT_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_LAB_RESULT_ACTION_MODIFY_LAB_RESULT_SUCCESS_MESSAGE'
        );

        // finished with success
        finished(undefined, item);
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = this.entityData.deleted ? undefined : {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: LabResultModel) => item.sampleIdentifier?.trim().length > 0 ?
        item.sampleIdentifier :
        moment(item.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
      link: (item: LabResultModel) => {
        if (this._personType === EntityType.CONTACT) {
          return [`/lab-results/contacts/${this.entityData.id}/${item.id}`];
        } else if (this._personType === EntityType.CASE) {
          return [`/lab-results/cases/${this.entityData.id}/${item.id}`];
        }
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'sampleIdentifier',
      'dateSampleTaken'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = LabResultModel.generateAdvancedFilters({
      selectedOutbreak: () => this.selectedOutbreak,
      options: {
        labName: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSampleType: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestType: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestResult: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
        sampleIdentifier: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // remove any relationships
    data.queryBuilder.clearRelationships();

    // retrieve data
    this.expandListRecords$ = this.labResultDataService
      .getEntityLabResults(
        this.selectedOutbreak.id,
        EntityModel.getLinkForEntityType(this._personType),
        this.entityData.id,
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
