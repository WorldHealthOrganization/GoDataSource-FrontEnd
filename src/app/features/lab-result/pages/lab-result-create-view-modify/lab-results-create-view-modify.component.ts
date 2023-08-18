import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { Observable, throwError } from 'rxjs';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, map, takeUntil } from 'rxjs/operators';
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
import { V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../../../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { DomSanitizer } from '@angular/platform-browser';
import {
  IV2SideDialogConfigInputToggleCheckbox,
  V2SideDialogConfigInputType
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { EntityLabResultHelperService } from '../../../../core/services/helper/entity-lab-result-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-lab-results-create-view-modify',
  templateUrl: './lab-results-create-view-modify.component.html'
})
export class LabResultsCreateViewModifyComponent extends CreateViewModifyComponent<LabResultModel> implements OnDestroy {
  // constants
  private static readonly TAB_NAMES_QUESTIONNAIRE: string = 'questionnaire';

  // data
  entityData: CaseModel | ContactModel;
  private _personType: EntityType;

  // constants
  EntityType = EntityType;

  // hide/show question numbers
  hideQuestionNumbers: boolean = false;

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    private labResultDataService: LabResultDataService,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private domSanitizer: DomSanitizer,
    private referenceDataHelperService: ReferenceDataHelperService,
    private entityLabResultHelperService: EntityLabResultHelperService,
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
      authDataService
    );

    // get data
    this._personType = this.activatedRoute.snapshot.data.personType;
    this.entityData = this.activatedRoute.snapshot.data.entityData;

    // do we have tabs options already saved ?
    const generalSettings: {
      [key: string]: any
    } = this.authDataService
      .getAuthenticatedUser()
      .getSettings(UserSettings.LAB_RESULT_GENERAL);
    const hideQuestionNumbers: {
      [key: string]: any
    } = generalSettings && generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS] ?
      generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS][CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS] :
      undefined;

    // use the saved options
    this.hideQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[LabResultsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] : false;
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
            label: `${this.i18nService.instant(this.entityData.name)} ${this.i18nService.instant('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE')}`,
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
            label: `${this.i18nService.instant(this.entityData.name)} ${this.i18nService.instant('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE')}`,
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
          label: this.i18nService.instant(
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
          label: this.i18nService.instant(
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
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    // tab custom configuration
    this.tabConfiguration = {
      inputs: [
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_COMMON_LABEL_TAB_OPTIONS'
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: LabResultsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_LAB_RESULT_TAB_OPTION_SHOW_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_LAB_RESULT_TAB_OPTION_SHOW_QUESTION_NUMBERS',
          value: !this.hideQuestionNumbers
        }
      ],
      apply: (data, finish) => {
        // save settings
        const hideQuestionNumbers: boolean = !(data.map[LabResultsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] as IV2SideDialogConfigInputToggleCheckbox).value;
        this.updateGeneralSettings(
          `${UserSettings.LAB_RESULT_GENERAL}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS}`, {
            [LabResultsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE]: hideQuestionNumbers
          }, () => {
            // update ui
            this.hideQuestionNumbers = hideQuestionNumbers;
            this.tabsV2Component.detectChanges();

            // finish
            finish();
          });
      }
    };

    // tabs
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
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_LAB_RESULT_ACTION_CREATE_LAB_RESULT_BUTTON'),
          message: () => this.i18nService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.entityData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: LabResultModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          this._personType === EntityType.CASE ?
            [`/lab-results/cases/${this.entityData.id}/${data.id}/view`] :
            [`/lab-results/contacts/${this.entityData.id}/${data.id}/view`], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return this.entityLabResultHelperService.generateTabsDetails({
      isCreate: this.isCreate,
      itemData: this.itemData,
      options: {
        labName: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.labName
        ),
        labSampleType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.sampleType
        ),
        labTestType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.testType
        ),
        labTestResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.result
        ),
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSequenceLaboratory: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.sequence?.labId
        ),
        labSequenceResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.sequence?.resultId
        )
      }
    });
  }

  /**
   * Initialize tabs - Questionnaire
   */
  private initializeTabsQuestionnaire(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: LabResultsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
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
        hideQuestionNumbers: () => {
          return this.hideQuestionNumbers;
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
            label: 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_LAB_RESULT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
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
      type: CreateViewModifyV2ExpandColumnType.STATUS_AND_DETAILS,
      link: (item: LabResultModel) => {
        if (this._personType === EntityType.CONTACT) {
          return [`/lab-results/contacts/${this.entityData.id}/${item.id}`];
        } else if (this._personType === EntityType.CASE) {
          return [`/lab-results/cases/${this.entityData.id}/${item.id}`];
        }
      },
      statusVisible: this.expandListColumnRenderer?.statusVisible === undefined ?
        true :
        this.expandListColumnRenderer.statusVisible,
      maxNoOfStatusForms: 1,
      get: {
        status: (item: LabResultModel) => {
          // must initialize - optimization to not recreate the list everytime there is an event since data won't change ?
          if (!item.uiStatusForms) {
            // determine forms
            const forms: V2ColumnStatusForm[] = this.entityLabResultHelperService.getStatusForms({
              item
            });

            // create html
            let html: string = '';
            forms.forEach((form, formIndex) => {
              html += AppListTableV2Component.renderStatusForm(
                form,
                formIndex < forms.length - 1
              );
            });

            // convert to safe html
            item.uiStatusForms = this.domSanitizer.bypassSecurityTrustHtml(html);
          }

          // finished
          return item.uiStatusForms;
        },
        text: (item: LabResultModel) => item.sampleIdentifier?.trim().length > 0 ?
          item.sampleIdentifier :
          moment(item.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
        details: undefined
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
      'dateSampleTaken',
      'questionnaireAnswers'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.entityLabResultHelperService.generateAdvancedFiltersAggregate({
      selectedOutbreak: () => this.selectedOutbreak,
      options: {
        labName: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labSampleType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labTestType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labTestResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        labSequenceLaboratory: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labSequenceResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        )
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
        // determine alertness
        map((labResults: LabResultModel[]) => {
          return this.entityLabResultHelperService.determineAlertness(
            this.selectedOutbreak.labResultsTemplate,
            labResults
          );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
