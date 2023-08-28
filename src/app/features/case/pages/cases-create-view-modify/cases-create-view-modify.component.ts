import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { Observable, throwError } from 'rxjs';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabTable, ICreateViewModifyV2TabTableRecordsList
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { moment } from '../../../../core/helperClasses/x-moment';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { Subscription } from 'rxjs/internal/Subscription';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { Location } from '@angular/common';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputLinkWithAction,
  IV2SideDialogConfigInputToggleCheckbox,
  V2SideDialogConfigInputType
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { EntityFollowUpHelperService } from '../../../../core/services/helper/entity-follow-up-helper.service';
import { TeamModel } from '../../../../core/models/team.model';
import { V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../../../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { EntityCaseHelperService } from '../../../../core/services/helper/entity-case-helper.service';
import { EntityLabResultHelperService } from '../../../../core/services/helper/entity-lab-result-helper.service';
import { CreateViewModifyHelperService } from '../../../../core/services/helper/create-view-modify-helper.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-cases-create-view-modify',
  templateUrl: './cases-create-view-modify.component.html'
})
export class CasesCreateViewModifyComponent extends CreateViewModifyComponent<CaseModel> implements OnDestroy {
  // constants
  private static readonly TAB_NAMES_QUESTIONNAIRE: string = 'questionnaire';
  private static readonly TAB_NAMES_QUESTIONNAIRE_AS_CONTACT: string = 'questionnaire_as_contact';

  // case visual id mask
  private _caseVisualIDMask: {
    mask: string
  };

  // check for duplicate
  private _duplicateCheckingTimeout: number;
  private _duplicateCheckingSubscription: Subscription;
  private _personDuplicates: EntityModel[] = [];
  private _previousChecked: {
    firstName: string,
    lastName: string,
    middleName: string
  } = {
      firstName: '',
      lastName: '',
      middleName: ''
    };

  // custom uuid creation ?
  customCaseUUID: string;

  // hide/show question numbers
  hideCaseQuestionNumbers: boolean = false;
  hideContactQuestionNumbers: boolean = false;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected createViewModifyHelperService: CreateViewModifyHelperService,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected router: Router,
    protected caseDataService: CaseDataService,
    protected systemSettingsDataService: SystemSettingsDataService,
    protected location: Location,
    protected dialogV2Service: DialogV2Service,
    protected entityDataService: EntityDataService,
    protected entityHelperService: EntityHelperService,
    protected entityLabResultHelperService: EntityLabResultHelperService,
    protected entityFollowUpHelperService: EntityFollowUpHelperService,
    protected domSanitizer: DomSanitizer,
    protected referenceDataHelperService: ReferenceDataHelperService,
    private entityCaseHelperService: EntityCaseHelperService
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      createViewModifyHelperService,
      outbreakAndOutbreakTemplateHelperService
    );

    // do we need to use custom id ?
    if (this.isCreate) {
      const uid: string = this.activatedRoute.snapshot.queryParams.uid;
      if (uid) {
        this.customCaseUUID = uid;
      }
    }

    // do we have tabs options already saved ?
    const generalSettings: {
      [key: string]: any
    } = this.authDataService
      .getAuthenticatedUser()
      .getSettings(UserSettings.CASE_GENERAL);
    const hideQuestionNumbers: {
      [key: string]: any
    } = generalSettings && generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS] ?
      generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS][CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS] :
      undefined;

    // use the saved options
    this.hideCaseQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] : false;
    this.hideContactQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT] : false;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // cancel previous timout that will trigger request
    if (this._duplicateCheckingTimeout) {
      // clear timeout
      clearTimeout(this._duplicateCheckingTimeout);
      this._duplicateCheckingTimeout = undefined;
    }

    // remove global notifications
    this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);
    this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DATE_OF_REPORTING_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
    this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_HOSPITALIZATION_START_DATE_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): CaseModel {
    return new CaseModel({
      addresses: [new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS,
        date: moment().toISOString()
      })]
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: CaseModel): Observable<CaseModel> {
    return this.caseDataService
      .getCase(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.caseId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // initialize visual ID mask
    this._caseVisualIDMask = {
      mask: this.entityCaseHelperService.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
    };

    // set visual id for case
    this.itemData.visualId = this.isCreate ?
      this._caseVisualIDMask.mask :
      this.itemData.visualId;

    // check if record has duplicate
    if (
      this.isView ||
      this.isModify
    ) {
      // remove global notifications
      this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

      // show global notifications
      this.checkForPersonExistence();
      this.checkForOnsetAfterReporting();
      this.checkForOnsetAfterHospitalizationStartDate();
    }
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
            ['/account/my-profile']
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

    // case onset
    if (
      this.activatedRoute.snapshot.queryParams.onset &&
      CaseModel.canListOnsetBeforePrimaryReport(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE',
        action: {
          link: ['/relationships/date-onset']
        }
      });
    }

    // case onset long
    if (
      this.activatedRoute.snapshot.queryParams.longPeriod &&
      CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE',
        action: {
          link: ['/relationships/long-period']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      if (this.customCaseUUID) {
        this.breadcrumbs.push({
          label: this.createViewModifyHelperService.i18nService.instant(
            'LNG_PAGE_CREATE_CASE_WITH_UID_TITLE', {
              uid: this.customCaseUUID
            }
          ),
          action: null
        });
      } else {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_CREATE_CASE_TITLE',
          action: null
        });
      }
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_CASE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_CASE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {
    // nothing to do ?
    if (this.isCreate) {
      return;
    }

    // reset
    this.breadcrumbInfos = [];

    // was contact ?
    if (this.itemData.wasContact) {
      this.breadcrumbInfos.push({
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
        tooltip: this.itemData.dateBecomeCase ?
          `${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE')}: ${moment(this.itemData.dateBecomeCase).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
          undefined
      });
    }

    // was contact of contact ?
    if (this.itemData.wasContactOfContact) {
      this.breadcrumbInfos.push({
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        tooltip: this.itemData.dateBecomeCase ?
          `${this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE')}: ${moment(this.itemData.dateBecomeCase).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
          undefined
      });
    }
  }

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
          name: CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_CASE_TAB_OPTION_SHOW_CASE_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_CASE_TAB_OPTION_SHOW_CASE_QUESTION_NUMBERS',
          value: !this.hideCaseQuestionNumbers
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_CASE_TAB_OPTION_SHOW_CONTACT_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_CASE_TAB_OPTION_SHOW_CONTACT_QUESTION_NUMBERS',
          value: !this.hideContactQuestionNumbers
        }
      ],
      apply: (data, finish) => {
        // save settings
        const hideCaseQuestionNumbers: boolean = !(data.map[CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] as IV2SideDialogConfigInputToggleCheckbox).value;
        const hideContactQuestionNumbers: boolean = !(data.map[CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT] as IV2SideDialogConfigInputToggleCheckbox).value;
        this.updateGeneralSettings(
          `${UserSettings.CASE_GENERAL}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS}`, {
            [CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE]: hideCaseQuestionNumbers,
            [CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT]: hideContactQuestionNumbers
          }, () => {
            // update ui
            this.hideCaseQuestionNumbers = hideCaseQuestionNumbers;
            this.hideContactQuestionNumbers = hideContactQuestionNumbers;
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
        this.initializeTabsPersonal(),

        // Epidemiology
        this.initializeTabsEpidemiology(),

        // Questionnaires
        this.initializeTabsQuestionnaire(),
        this.initializeTabsQuestionnaireAsContact(),

        // Contacts, exposures ...
        this.initializeTabsContacts(),
        this.initializeTabsExposures(),
        this.initializeTabsLabResults(),
        this.initializeTabsViewFollowUps()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_BUTTON'),
          message: () => this.createViewModifyHelperService.i18nService.instant(
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
        data: CaseModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/cases',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return this.entityCaseHelperService.generateTabsPersonal(this.selectedOutbreak, {
      selectedOutbreak: this.selectedOutbreak,
      isCreate: this.isCreate,
      itemData: this.itemData,
      checkForPersonExistence: () => {
        // we need arrow function to keep context (or use apply)
        this.checkForPersonExistence();
      },
      caseVisualIDMask: this._caseVisualIDMask,
      options: {
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.occupation
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        documentType: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): ICreateViewModifyV2Tab {
    return this.entityCaseHelperService.generateTabsEpidemiology(this.selectedOutbreak, {
      selectedOutbreak: this.selectedOutbreak,
      isCreate: this.isCreate,
      itemData: this.itemData,
      checkForOnsetAfterReporting: () => {
        // we need arrow function to keep context (or use apply)
        this.checkForOnsetAfterReporting();
      },
      checkForOnsetAfterHospitalizationStartDate: () => {
        // we need arrow function to keep context (or use apply)
        this.checkForOnsetAfterHospitalizationStartDate();
      },
      options: {
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.classification
        ),
        investigationStatus: (this.activatedRoute.snapshot.data.investigationStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        outcome: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.outcomeId
        ),
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.riskLevel
        ),
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.vaccinesReceived?.map((vaccine) => vaccine.vaccine)
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.vaccinesReceived?.map((vaccine) => vaccine.status)
        ),
        dateRangeType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.dateRanges?.map((date) => date.typeId)
        ),
        dateRangeCenter: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.dateRanges?.map((date) => date.centerName)
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
      name: CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
      label: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: (value) => {
            this.itemData.questionnaireAnswers = value;
          }
        },
        hideQuestionNumbers: () => {
          return this.hideCaseQuestionNumbers;
        },
        updateErrors: (errorsHTML) => {
          errors = errorsHTML;
        }
      },
      invalidHTMLSuffix: () => {
        return errors;
      },
      visible: () => this.selectedOutbreak.caseInvestigationTemplate?.length > 0
    };
  }

  /**
   * Initialize tabs - Contact Questionnaire
   */
  private initializeTabsQuestionnaireAsContact(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: CasesCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT,
      label: `${this.createViewModifyHelperService.i18nService.instant(EntityType.CONTACT)} ${this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE')}`,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswersContact',
        questionnaire: this.selectedOutbreak.contactInvestigationTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswersContact,
          set: (value) => {
            this.itemData.questionnaireAnswersContact = value;
          }
        },
        hideQuestionNumbers: () => {
          return this.hideContactQuestionNumbers;
        },
        updateErrors: (errorsHTML) => {
          errors = errorsHTML;
        }
      },
      invalidHTMLSuffix: () => {
        return errors;
      },
      visible: () => (this.isView || !this.selectedOutbreak.disableModifyingLegacyQuestionnaire) &&
        this.selectedOutbreak.contactInvestigationTemplate?.length > 0 &&
        this.itemData.wasContact
    };
  }

  /**
   * Initialize tabs - Contacts
   */
  private initializeTabsContacts(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'relationships_contacts',
      label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
      visible: () => this.isView &&
        CaseModel.canListRelationshipContacts(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumnActions: this.entityHelperService.retrieveTableColumnActions({
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          selectedOutbreak: () => this.selectedOutbreak,
          entity: this.itemData,
          relationshipType: RelationshipType.CONTACT,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.entityHelperService.retrieveTableColumns({
          personType: this.activatedRoute.snapshot.data.personType,
          cluster: this.activatedRoute.snapshot.data.cluster,
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
          }
        }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options,
            yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // refresh data
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.records$ = this.entityHelperService
            .retrieveRecords(
              RelationshipType.CONTACT,
              this.selectedOutbreak,
              this.itemData,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();
          countQueryBuilder.clearFields();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityHelperService
            .retrieveRecordsCount(
              RelationshipType.CONTACT,
              this.selectedOutbreak,
              this.itemData,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
  }

  /**
   * Initialize tabs - Exposures
   */
  private initializeTabsExposures(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'relationships_exposures',
      label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
      visible: () => this.isView &&
        CaseModel.canListRelationshipExposures(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumnActions: this.entityHelperService.retrieveTableColumnActions({
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          selectedOutbreak: () => this.selectedOutbreak,
          entity: this.itemData,
          relationshipType: RelationshipType.EXPOSURE,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.entityHelperService.retrieveTableColumns({
          personType: this.activatedRoute.snapshot.data.personType,
          cluster: this.activatedRoute.snapshot.data.cluster,
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
          }
        }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options,
            yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // refresh data
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.records$ = this.entityHelperService
            .retrieveRecords(
              RelationshipType.EXPOSURE,
              this.selectedOutbreak,
              this.itemData,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();
          countQueryBuilder.clearFields();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityHelperService
            .retrieveRecordsCount(
              RelationshipType.EXPOSURE,
              this.selectedOutbreak,
              this.itemData,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
  }

  /**
   * Initialize tabs - Lab results
   */
  private initializeTabsLabResults(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'lab_results',
      label: 'LNG_PAGE_MODIFY_CASE_ACTION_SEE_LAB_RESULTS',
      visible: () => this.isView &&
        LabResultModel.canList(this.authUser) &&
        CaseModel.canListLabResult(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.CASE_LAB_FIELDS,
        advancedFilterType: Constants.APP_PAGE.CASE_LAB_RESULTS.value,
        tableColumnActions: this.entityLabResultHelperService.retrieveTableColumnActions({
          personType: this.itemData.type,
          selectedOutbreak: () => this.selectedOutbreak,
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.entityLabResultHelperService.retrieveTableColumns(this.selectedOutbreak, {
          user: this.activatedRoute.snapshot.data.user,
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
            labSequenceLaboratory: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            ),
            labSequenceResult: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              undefined
            )
          }
        }),
        advancedFilters: this.entityLabResultHelperService.generateAdvancedFiltersPerson(this.selectedOutbreak, {
          labResultsTemplate: () => this.selectedOutbreak.labResultsTemplate,
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
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // attach fields restrictions
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          const fields: string[] = this.entityLabResultHelperService.refreshListFields();
          if (fields.length > 0) {
            localTab.queryBuilder.clearFields();
            localTab.queryBuilder.fields(...fields);
          }

          // refresh data
          localTab.records$ = this.entityLabResultHelperService
            .retrieveRecords(
              this.selectedOutbreak,
              EntityModel.getLinkForEntityType(this.itemData.type),
              this.itemData.id,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();
          countQueryBuilder.clearFields();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityLabResultHelperService
            .retrieveRecordsCount(
              this.selectedOutbreak.id,
              this.itemData.type,
              this.itemData.id,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
  }

  /**
   * Initialize tabs - Follow-ups
   */
  private initializeTabsViewFollowUps(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'follow_ups_registered_as_contact',
      label: 'LNG_PAGE_LIST_FOLLOW_UPS_REGISTERED_AS_CONTACT_TITLE',
      visible: () => this.isView &&
        FollowUpModel.canList(this.authUser) &&
        this.itemData.wasContact,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.INDIVIDUAL_CONTACT_FOLLOW_UPS.value,
        tableColumnActions: this.entityFollowUpHelperService.retrieveTableColumnActions({
          entityData: this.itemData,
          selectedOutbreak: () => this.selectedOutbreak,
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          team: this.activatedRoute.snapshot.data.team,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.entityFollowUpHelperService.retrieveTableColumns({
          team: this.activatedRoute.snapshot.data.team,
          user: this.activatedRoute.snapshot.data.user,
          dailyFollowUpStatus: this.activatedRoute.snapshot.data.dailyFollowUpStatus,
          options: {
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
          }
        }),
        advancedFilters: this.entityFollowUpHelperService.generateAdvancedFiltersPerson(this.selectedOutbreak, {
          contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
          options: {
            team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
            addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // attach fields restrictions
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          const fields: string[] = this.entityFollowUpHelperService.refreshListFields();
          if (fields.length > 0) {
            localTab.queryBuilder.clearFields();
            localTab.queryBuilder.fields(...fields);
          }

          // add contact id
          localTab.queryBuilder.filter.byEquality(
            'personId',
            this.itemData.id
          );

          // make sure we always sort by something
          // default by date asc
          if (localTab.queryBuilder.sort.isEmpty()) {
            localTab.queryBuilder.sort.by(
              'date',
              RequestSortDirection.ASC
            );
          }

          // refresh data
          localTab.records$ = this.entityFollowUpHelperService
            .retrieveRecords(
              this.selectedOutbreak,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();
          countQueryBuilder.clearFields();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityFollowUpHelperService
            .retrieveRecordsCount(
              this.selectedOutbreak.id,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
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
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.isCreate || !this.itemData.wasContact ?
                    undefined :
                    [
                      {
                        type: V2SideDialogConfigInputType.KEY_VALUE,
                        name: 'followUp.originalStartDate',
                        placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_ORIGINAL_START_DATE',
                        value: this.itemData.followUp?.originalStartDate ?
                          moment(this.itemData.followUp.originalStartDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                          '—'
                      }, {
                        type: V2SideDialogConfigInputType.KEY_VALUE,
                        name: 'followUp.startDate',
                        placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_START_DATE',
                        value: this.itemData.followUp?.startDate ?
                          moment(this.itemData.followUp.startDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                          '—'
                      }, {
                        type: V2SideDialogConfigInputType.KEY_VALUE,
                        name: 'followUp.endDate',
                        placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
                        value: this.itemData.followUp?.endDate ?
                          moment(this.itemData.followUp.endDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                          '—'
                      }
                    ]
                );
              }
            }
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER
          },

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
            visible: () => this.selectedOutbreakIsActive && CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => this.selectedOutbreakIsActive && CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
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
              FollowUpModel.canList(this.authUser)
            )
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
      finished,
      loading,
      forms
    ) => {
      // items marked as not duplicates
      let itemsMarkedAsNotDuplicates: string[];

      // create / update
      const runCreateOrUpdate = (overwriteFinished: (item: CaseModel) => void) => {
        // attach custom id if we have one
        if (
          type === CreateViewModifyV2ActionType.CREATE &&
          this.customCaseUUID
        ) {
          data.id = this.customCaseUUID;
        }

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
        ).subscribe((item: CaseModel) => {
          // finished
          const finishedProcessingData = () => {
            // success creating / updating case
            this.createViewModifyHelperService.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE' :
                'LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE'
            );

            // finished with success
            if (!overwriteFinished) {
              finished(undefined, item);
            } else {
              // mark pristine
              forms.markFormsAsPristine();

              // hide loading
              loading.hide();

              // call overwrite
              overwriteFinished(item);
            }
          };

          // there are no records marked as NOT duplicates ?
          if (
            !itemsMarkedAsNotDuplicates ||
            itemsMarkedAsNotDuplicates.length < 1
          ) {
            finishedProcessingData();
          } else {
            // mark records as not duplicates
            this.entityDataService
              .markPersonAsOrNotADuplicate(
                this.selectedOutbreak.id,
                EntityType.CASE,
                item.id,
                itemsMarkedAsNotDuplicates
              )
              .pipe(
                // handle error
                catchError((err) => {
                  // show error
                  finished(err, undefined);

                  // send error further
                  return throwError(err);
                }),

                // should be the last pipe
                takeUntil(this.destroyed$)
              )
              .subscribe(() => {
                // finished
                finishedProcessingData();
              });
          }
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
            return runCreateOrUpdate(undefined);
          }

          // check for duplicates
          this.entityDataService
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
            .subscribe((response) => {
              // no duplicates ?
              if (response.duplicates.length < 1) {
                // create case
                return runCreateOrUpdate(undefined);
              }

              // hide loading since this will be handled further by the side dialog
              loading.hide();

              // hide notification
              // - hide alert
              this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

              // construct list of actions
              const itemsToManage: IV2SideDialogConfigInputLinkWithAction[] = response.duplicates.map((item, index) => {
                return {
                  type: V2SideDialogConfigInputType.LINK_WITH_ACTION,
                  name: `actionsLink[${item.model.id}]`,
                  placeholder: (index + 1) + '. ' + EntityModel.getDuplicatePersonDetails(
                    item,
                    this.createViewModifyHelperService.i18nService.instant(item.model.type),
                    this.createViewModifyHelperService.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                    this.createViewModifyHelperService.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                  ),
                  link: () => ['/cases', item.model.id, 'view'],
                  actions: {
                    type: V2SideDialogConfigInputType.TOGGLE,
                    name: `actionsAction[${item.model.id}]`,
                    value: Constants.DUPLICATE_ACTION.NO_ACTION,
                    data: item.model.id,
                    options: [
                      {
                        label: Constants.DUPLICATE_ACTION.NO_ACTION,
                        value: Constants.DUPLICATE_ACTION.NO_ACTION
                      },
                      {
                        label: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE,
                        value: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE
                      },
                      {
                        label: Constants.DUPLICATE_ACTION.MERGE,
                        value: Constants.DUPLICATE_ACTION.MERGE,
                        disabled: item.model.type !== EntityType.CASE
                      }
                    ]
                  }
                };
              });

              // construct & display duplicates dialog
              this.dialogV2Service
                .showSideDialog({
                  title: {
                    get: () => 'LNG_COMMON_LABEL_HAS_DUPLICATES_TITLE'
                  },
                  hideInputFilter: true,
                  dontCloseOnBackdrop: true,
                  width: '55rem',
                  inputs: [
                    // Title
                    {
                      type: V2SideDialogConfigInputType.DIVIDER,
                      placeholder: this.isCreate ?
                        'LNG_PAGE_CREATE_CASE_DUPLICATES_DIALOG_CONFIRM_MSG' :
                        'LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
                      placeholderMultipleLines: true
                    },

                    // Actions
                    ...itemsToManage
                  ],
                  bottomButtons: [{
                    type: IV2SideDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_SAVE',
                    color: 'primary'
                  }, {
                    type: IV2SideDialogConfigButtonType.CANCEL,
                    label: 'LNG_COMMON_BUTTON_CANCEL',
                    color: 'text'
                  }]
                })
                .subscribe((dialogResponse) => {
                  // cancelled ?
                  if (dialogResponse.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                    // show back duplicates alert
                    this.showDuplicatesAlert();

                    // finished
                    return;
                  }

                  // determine number of items to merge / mark as not duplicates
                  const itemsToMerge: string[] = [];
                  itemsMarkedAsNotDuplicates = [];

                  // go through items to manage
                  dialogResponse.data.inputs.forEach((item) => {
                    // not important ?
                    if (item.type !== V2SideDialogConfigInputType.LINK_WITH_ACTION) {
                      return;
                    }

                    // take action
                    switch (item.actions.value) {
                      case Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE:
                        itemsMarkedAsNotDuplicates.push(item.actions.data);
                        break;
                      case Constants.DUPLICATE_ACTION.MERGE:
                        itemsToMerge.push(item.actions.data);
                        break;
                    }
                  });

                  // hide dialog
                  dialogResponse.handler.hide();

                  // show back loading
                  loading.show();

                  // save data first, followed by redirecting to merge
                  if (itemsToMerge.length > 0) {
                    runCreateOrUpdate((item) => {
                      // construct list of ids
                      const mergeIds: string[] = [
                        item.id,
                        ...itemsToMerge
                      ];

                      // redirect to merge
                      this.router.navigate(
                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CASE), 'merge'], {
                          queryParams: {
                            ids: JSON.stringify(mergeIds)
                          }
                        }
                      );
                    });
                  } else {
                    runCreateOrUpdate(undefined);
                  }
                });
            });
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.STATUS_AND_DETAILS,
      link: (item: CaseModel) => ['/cases', item.id, 'view'],
      statusVisible: this.expandListColumnRenderer?.statusVisible === undefined ?
        true :
        this.expandListColumnRenderer.statusVisible,
      maxNoOfStatusForms: 3,
      get: {
        status: (item: CaseModel) => {
          // must initialize - optimization to not recreate the list everytime there is an event since data won't change ?
          if (!item.uiStatusForms) {
            // determine forms
            const forms: V2ColumnStatusForm[] = this.entityCaseHelperService.getStatusForms({
              item,
              classification: this.activatedRoute.snapshot.data.classification,
              outcome: this.activatedRoute.snapshot.data.outcome
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
        text: (item: CaseModel) => item.name,
        details: (item: CaseModel) => item.visualId
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'firstName',
      'lastName',
      'middleName',
      'visualId',
      'classification',
      'outcomeId',
      'questionnaireAnswers'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.entityCaseHelperService.generateAdvancedFilters(this.selectedOutbreak, {
      caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
      options: {
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        outcome: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        clusterLoad: (finished) => {
          finished(this.activatedRoute.snapshot.data.cluster);
        },
        pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        investigationStatus: (this.activatedRoute.snapshot.data.investigationStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        documentType: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        dateRangeType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        dateRangeCenter: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
        or: [
          {
            firstName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            lastName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            middleName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            visualId: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.caseDataService
      .getCasesList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
        // process data
        map((cases: CaseModel[]) => {
          return EntityModel.determineAlertness<CaseModel>(
            this.selectedOutbreak.caseInvestigationTemplate,
            cases
          );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Show duplicates alert
   */
  private showDuplicatesAlert(): void {
    // nothing to show ?
    if (
      !this._personDuplicates ||
      this._personDuplicates.length < 1
    ) {
      // finished
      return;
    }

    // update message & show alert if not visible already
    // - with links for cases / contacts view page if we have enough rights
    this.createViewModifyHelperService.toastV2Service.notice(
      this.createViewModifyHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_DUPLICATE_PERSONS') +
      ' ' +
      this._personDuplicates
        .map((item) => {
          // check rights
          if (
            (
              item.model.type === EntityType.CASE &&
              !CaseModel.canView(this.authUser)
            ) || (
              item.model.type === EntityType.CONTACT &&
              !ContactModel.canView(this.authUser)
            ) || (
              item.model.type === EntityType.CONTACT_OF_CONTACT &&
              !ContactOfContactModel.canView(this.authUser)
            )
          ) {
            return `${item.model.name} (${this.createViewModifyHelperService.i18nService.instant(item.type)})`;
          }

          // create url
          let entityPath: string = '';
          switch (item.model.type) {
            case EntityType.CASE:
              entityPath = 'cases';
              break;
            case EntityType.CONTACT:
              entityPath = 'contacts';
              break;
            case EntityType.CONTACT_OF_CONTACT:
              entityPath = 'contacts-of-contacts';
              break;
          }
          const url =  `${entityPath}/${item.model.id}/view`;

          // finished
          return `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.model.name} (${this.createViewModifyHelperService.i18nService.instant(item.model.type)})</span></a>`;
        })
        .join(', '),
      undefined,
      AppMessages.APP_MESSAGE_DUPLICATE_PERSONS
    );
  }

  /**
   * Check if a contact exists with the same name
   */
  private checkForPersonExistence(): void {
    // cancel previous timout that will trigger request
    if (this._duplicateCheckingTimeout) {
      // clear timeout
      clearTimeout(this._duplicateCheckingTimeout);
      this._duplicateCheckingTimeout = undefined;
    }

    // cancel previous request
    if (this._duplicateCheckingSubscription) {
      // stop
      this._duplicateCheckingSubscription.unsubscribe();
      this._duplicateCheckingSubscription = undefined;
    }

    // don't check if not active outbreak
    if (!this.selectedOutbreakIsActive) {
      return;
    }

    // check for duplicate
    this._duplicateCheckingTimeout = setTimeout(
      () => {
        // timeout executed
        this._duplicateCheckingTimeout = undefined;

        // update alert
        const updateAlert = () => {
          // must update message ?
          // - hide alert
          this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

          // show duplicates alert
          this.showDuplicatesAlert();
        };

        // nothing to show ?
        if (
          !this.selectedOutbreak?.id ||
          (
            this.itemData.firstName &&
            !this.itemData.lastName &&
            !this.itemData.middleName
          ) || (
            this.itemData.lastName &&
            !this.itemData.firstName &&
            !this.itemData.middleName
          ) || (
            this.itemData.middleName &&
            !this.itemData.firstName &&
            !this.itemData.lastName
          )
        ) {
          // reset
          this._personDuplicates = undefined;
          this._previousChecked.firstName = this.itemData.firstName;
          this._previousChecked.lastName = this.itemData.lastName;
          this._previousChecked.middleName = this.itemData.middleName;

          // update alert
          updateAlert();

          // finished
          return;
        }

        // same as before ?
        if (
          this._previousChecked.firstName === this.itemData.firstName &&
          this._previousChecked.lastName === this.itemData.lastName &&
          this._previousChecked.middleName === this.itemData.middleName
        ) {
          // nothing to do
          return;
        }

        // update previous values
        this._previousChecked.firstName = this.itemData.firstName;
        this._previousChecked.lastName = this.itemData.lastName;
        this._previousChecked.middleName = this.itemData.middleName;

        // check for duplicates
        this._duplicateCheckingSubscription = this.entityDataService
          .findDuplicates(
            this.selectedOutbreak.id,
            this.isView || this.isModify ?
              {
                id: this.itemData.id,
                ...this._previousChecked
              } :
              this._previousChecked
          )
          .pipe(
            // handle error
            catchError((err) => {
              // show error
              this.createViewModifyHelperService.toastV2Service.error(err);

              // finished
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          ).subscribe((foundPersons: EntityDuplicatesModel) => {
            // request executed
            this._duplicateCheckingSubscription = undefined;

            // update what we found
            this._personDuplicates = foundPersons?.duplicates?.length ?
              [...foundPersons.duplicates] :
              [];

            // update alert
            updateAlert();
          });
      },
      400
    );
  }

  /**
   * Check if "date of onset" is after "date of reporting
   */
  private checkForOnsetAfterReporting() {
    if (
      this.itemData.dateOfOnset &&
      this.itemData.dateOfReporting &&
      moment(this.itemData.dateOfOnset).isAfter(moment(this.itemData.dateOfReporting))
    ) {
      this.createViewModifyHelperService.toastV2Service.notice(
        'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET_IS_AFTER_DATE_OF_REPORTING',
        undefined,
        AppMessages.APP_MESSAGE_DATE_OF_REPORTING_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
      );
    } else {
      this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DATE_OF_REPORTING_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
    }
  }

  /**
   * Check if hospitalization start date is before date of onset
   */
  private checkForOnsetAfterHospitalizationStartDate() {
    // return if there is no valid date of onset or no hospitalization
    if (
      !this.itemData.dateOfOnset ||
      !moment(this.itemData.dateOfOnset).isValid() ||
      !this.itemData.dateRanges?.length
    ) {
      // make sure that there is no warning
      this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_HOSPITALIZATION_START_DATE_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

      return;
    }

    // parse hospitalization items
    for (const item of this.itemData.dateRanges) {
      if (
        item.startDate &&
        moment(item.startDate).isValid() &&
        moment(item.startDate).isBefore(moment(this.itemData.dateOfOnset))
      ) {
        this.createViewModifyHelperService.toastV2Service.notice(
          'LNG_HOSPITALISATION_ISOLATION_DATE_RANGE_WARNING_CASE_DATEOFONSET_AFTER_START_DATE',
          undefined,
          AppMessages.APP_MESSAGE_HOSPITALIZATION_START_DATE_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
        );

        // return if at least one mismatch found
        return;
      }
    }

    // hide warning if no mismatch found
    this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_HOSPITALIZATION_START_DATE_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  }
}
