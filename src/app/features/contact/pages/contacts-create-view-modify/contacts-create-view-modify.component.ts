import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, of, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabTable,
  ICreateViewModifyV2TabTableRecordsList
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { moment } from '../../../../core/helperClasses/x-moment';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { Subscription } from 'rxjs/internal/Subscription';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { Location } from '@angular/common';
import { TeamModel } from '../../../../core/models/team.model';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputLinkWithAction,
  IV2SideDialogConfigInputToggleCheckbox,
  V2SideDialogConfigInputType
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../../../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { DomSanitizer } from '@angular/platform-browser';
import { EventModel } from '../../../../core/models/event.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-contacts-create-view-modify',
  templateUrl: './contacts-create-view-modify.component.html'
})
export class ContactsCreateViewModifyComponent extends CreateViewModifyComponent<ContactModel> implements OnDestroy {
  // constants
  private static readonly TAB_NAMES_QUESTIONNAIRE: string = 'questionnaire';
  private static readonly TAB_NAMES_QUESTIONNAIRE_AS_CASE: string = 'questionnaire_as_case';

  // contact visual id mask
  private _contactVisualIDMask: {
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

  // relationship
  private _relationship: RelationshipModel;
  private _parentEntity: CaseModel | EventModel;

  // hide/show question numbers
  hideContactQuestionNumbers: boolean = false;
  hideCaseQuestionNumbers: boolean = false;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected router: Router,
    protected location: Location,
    protected entityDataService: EntityDataService,
    protected systemSettingsDataService: SystemSettingsDataService,
    protected domSanitizer: DomSanitizer,
    protected referenceDataHelperService: ReferenceDataHelperService,
    private clusterDataService: ClusterDataService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      personAndRelatedHelperService.redirectService,
      personAndRelatedHelperService.toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // get data
    if (this.isCreate) {
      this._parentEntity = this.activatedRoute.snapshot.data.entity;
    }

    // do we have tabs options already saved ?
    const generalSettings: {
      [key: string]: any
    } = this.authDataService
      .getAuthenticatedUser()
      .getSettings(UserSettings.CONTACT_GENERAL);
    const hideQuestionNumbers: {
      [key: string]: any
    } = generalSettings && generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS] ?
      generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS][CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS] :
      undefined;

    // use the saved options
    this.hideContactQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] : false;
    this.hideCaseQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE] : false;
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
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): ContactModel {
    return new ContactModel({
      addresses: [new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS,
        date: moment().toISOString()
      })]
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: ContactModel): Observable<ContactModel> {
    return this.personAndRelatedHelperService.contact.contactDataService
      .getContact(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.contactId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // initialize visual ID mask
    this._contactVisualIDMask = {
      mask: this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask)
    };

    // set visual id for case
    this.itemData.visualId = this.isCreate ?
      this._contactVisualIDMask.mask :
      this.itemData.visualId;

    // check if record has duplicate
    if (
      this.isView ||
      this.isModify
    ) {
      // remove global notifications
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

      // show global notifications
      this.checkForPersonExistence();
    }

    // initialize relationship
    if (this.isCreate) {
      this._relationship = new RelationshipModel();
    }
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_CONTACT_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_CONTACT_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_CONTACT_TITLE';
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

    // do we need to display parent entity data ?
    if (this._parentEntity) {
      // case / event list & view pages
      if (this._parentEntity.type === EntityType.CASE) {
        // case list page
        if (CaseModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CASES_TITLE',
            action: {
              link: ['/cases']
            }
          });
        }

        // case view page
        if (CaseModel.canView(this.authUser)) {
          this.breadcrumbs.push({
            label: this._parentEntity.name,
            action: {
              link: [`/cases/${this._parentEntity.id}/view`]
            }
          });
        }
      } else {
        // event list page
        if (EventModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_EVENTS_TITLE',
            action: {
              link: ['/events']
            }
          });
        }

        // event view page
        if (EventModel.canView(this.authUser)) {
          this.breadcrumbs.push({
            label: this._parentEntity.name,
            action: {
              link: [`/events/${this._parentEntity.id}/view`]
            }
          });
        }
      }
    }

    // contact list page
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_CONTACT_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_CONTACT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_CONTACT_TITLE', {
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

    // was case ?
    if (this.itemData.wasCase) {
      this.breadcrumbInfos.push({
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        tooltip: this.itemData.dateBecomeContact ?
          `${this.personAndRelatedHelperService.i18nService.instant('LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT')}: ${moment(this.itemData.dateBecomeContact).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
          undefined
      });
    }

    // was contact of contact ?
    if (this.itemData.wasContactOfContact) {
      this.breadcrumbInfos.push({
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        tooltip: this.itemData.dateBecomeContact ?
          `${this.personAndRelatedHelperService.i18nService.instant('LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT')}: ${moment(this.itemData.dateBecomeContact).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
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
          name: ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_CONTACT_TAB_OPTION_SHOW_CONTACT_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_CONTACT_TAB_OPTION_SHOW_CONTACT_QUESTION_NUMBERS',
          value: !this.hideContactQuestionNumbers
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_CONTACT_TAB_OPTION_SHOW_CASE_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_CONTACT_TAB_OPTION_SHOW_CASE_QUESTION_NUMBERS',
          value: !this.hideCaseQuestionNumbers
        }
      ],
      apply: (data, finish) => {
        // save settings
        const hideContactQuestionNumbers: boolean = !(data.map[ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] as IV2SideDialogConfigInputToggleCheckbox).value;
        const hideCaseQuestionNumbers: boolean = !(data.map[ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE] as IV2SideDialogConfigInputToggleCheckbox).value;
        this.updateGeneralSettings(
          `${UserSettings.CONTACT_GENERAL}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS}`, {
            [ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE]: hideContactQuestionNumbers,
            [ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE]: hideCaseQuestionNumbers
          }, () => {
            // update ui
            this.hideContactQuestionNumbers = hideContactQuestionNumbers;
            this.hideCaseQuestionNumbers = hideCaseQuestionNumbers;
            this.tabsV2Component.detectChanges();

            // finish
            finish();
          });
      }
    };

    // tab data
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal(),

        // Epidemiology
        this.initializeTabsEpidemiology(),

        // Questionnaires
        this.initializeTabsQuestionnaire(),
        this.initializeTabsQuestionnaireAsCase(),

        // Relationship - Create
        this.initializeTabsRelationship(),

        // Contacts, exposures ...
        this.initializeTabsContacts(),
        this.initializeTabsExposures(),
        this.initializeTabsLabResults(),
        this.initializeTabsViewFollowUps()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_BUTTON'),
          message: () => this.personAndRelatedHelperService.i18nService.instant(
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
        data: ContactModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/contacts',
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
    return this.personAndRelatedHelperService.contact.generateTabsPersonal(this.selectedOutbreak, {
      selectedOutbreak: this.selectedOutbreak,
      isCreate: this.isCreate,
      itemData: this.itemData,
      checkForPersonExistence: () => {
        // we need arrow function to keep context (or use apply)
        this.checkForPersonExistence();
      },
      detectChanges: () => {
        // update ui
        this.tabsV2Component.detectChanges();
      },
      contactVisualIDMask: this._contactVisualIDMask,
      parentEntity: this._parentEntity,
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
    return this.personAndRelatedHelperService.contact.generateTabsEpidemiology(this.selectedOutbreak, {
      isCreate: this.isCreate,
      itemData: this.itemData,
      options: {
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
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        followUpStatus: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.vaccinesReceived?.map((vaccine) => vaccine.vaccine)
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this.itemData.vaccinesReceived?.map((vaccine) => vaccine.status)
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
      name: ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
      label: 'LNG_PAGE_MODIFY_CONTACT_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.contactInvestigationTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: (value) => {
            this.itemData.questionnaireAnswers = value;
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
      visible: () => this.selectedOutbreak.contactInvestigationTemplate?.length > 0
    };
  }

  /**
   * Initialize tabs - Case Questionnaire
   */
  private initializeTabsQuestionnaireAsCase(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: ContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE,
      label: `${this.personAndRelatedHelperService.i18nService.instant(EntityType.CASE)} ${this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_MODIFY_CONTACT_TAB_CASE_QUESTIONNAIRE_TITLE')}`,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswersCase',
        questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswersCase,
          set: (value) => {
            this.itemData.questionnaireAnswersCase = value;
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
      visible: () => (this.isView || !this.selectedOutbreak.disableModifyingLegacyQuestionnaire) &&
        this.selectedOutbreak.caseInvestigationTemplate?.length > 0 &&
        this.itemData.wasCase
    };
  }

  /**
   * Initialize tabs - Relationship
   */
  private initializeTabsRelationship(): ICreateViewModifyV2Tab {
    return this.personAndRelatedHelperService.relationship.generateTabsDetails(this.selectedOutbreak, {
      entityId: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
      tabName: 'details',
      tabLabel: 'LNG_PAGE_CREATE_CONTACT_TAB_RELATIONSHIP_TITLE',
      tabVisible: () => {
        return this.isCreate;
      },
      inputName: (property) => `relationship[${property}]`,
      itemData: this._relationship,
      createCopySuffixButtons: () => undefined,
      checkForLastContactBeforeCaseOnSet: () => {
        // check last contact before date of onset of source case
        this.checkForLastContactBeforeCaseOnSet();
      },
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this._relationship?.exposureTypeId
        ),
        exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this._relationship?.exposureFrequencyId
        ),
        exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this._relationship?.exposureDurationId
        ),
        contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          this._relationship?.socialRelationshipTypeId
        ),
        cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
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
        ContactModel.canListRelationshipContacts(this.authUser) &&
        this.selectedOutbreak.isContactsOfContactsActive,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumnActions: this.personAndRelatedHelperService.relationship.retrieveTableColumnActions({
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
        tableColumns: this.personAndRelatedHelperService.relationship.retrieveTableColumns({
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
        advancedFilters: this.personAndRelatedHelperService.relationship.generateAdvancedFilters({
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
          localTab.records$ = this.personAndRelatedHelperService.relationship
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
          this.personAndRelatedHelperService.relationship
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
        ContactModel.canListRelationshipExposures(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumnActions: this.personAndRelatedHelperService.relationship.retrieveTableColumnActions({
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
        tableColumns: this.personAndRelatedHelperService.relationship.retrieveTableColumns({
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
        advancedFilters: this.personAndRelatedHelperService.relationship.generateAdvancedFilters({
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
          localTab.records$ = this.personAndRelatedHelperService.relationship
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
          this.personAndRelatedHelperService.relationship
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
        ContactModel.canListLabResult(this.authUser) &&
        this.selectedOutbreak.isContactLabResultsActive,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.CONTACT_LAB_FIELDS,
        advancedFilterType: Constants.APP_PAGE.CONTACT_LAB_RESULTS.value,
        tableColumnActions: this.personAndRelatedHelperService.labResult.retrieveTableColumnActions({
          personType: this.itemData.type,
          selectedOutbreak: () => this.selectedOutbreak,
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.personAndRelatedHelperService.labResult.retrieveTableColumns(this.selectedOutbreak, {
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
        advancedFilters: this.personAndRelatedHelperService.labResult.generateAdvancedFiltersPerson(this.selectedOutbreak, {
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
          const fields: string[] = this.personAndRelatedHelperService.labResult.refreshListFields();
          if (fields.length > 0) {
            localTab.queryBuilder.clearFields();
            localTab.queryBuilder.fields(...fields);
          }

          // refresh data
          localTab.records$ = this.personAndRelatedHelperService.labResult
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
          this.personAndRelatedHelperService.labResult
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
      name: 'follow_ups',
      label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_VIEW_FOLLOW_UPS',
      visible: () => this.isView &&
        FollowUpModel.canList(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.INDIVIDUAL_CONTACT_FOLLOW_UPS.value,
        tableColumnActions: this.personAndRelatedHelperService.followUp.retrieveTableColumnActions({
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
        tableColumns: this.personAndRelatedHelperService.followUp.retrieveTableColumns(this.selectedOutbreak, {
          team: this.activatedRoute.snapshot.data.team,
          user: this.activatedRoute.snapshot.data.user,
          dailyFollowUpStatus: this.activatedRoute.snapshot.data.dailyFollowUpStatus,
          options: {
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
          }
        }),
        advancedFilters: this.personAndRelatedHelperService.followUp.generateAdvancedFiltersPerson(this.selectedOutbreak, {
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
          const fields: string[] = this.personAndRelatedHelperService.followUp.refreshListFields();
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
          localTab.records$ = this.personAndRelatedHelperService.followUp
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
          this.personAndRelatedHelperService.followUp
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
          link: () => ['/contacts', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/contacts', this.itemData?.id, 'modify']
        },
        visible: () => ContactModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/contacts']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/contacts']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/contacts']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.personAndRelatedHelperService.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.isCreate ?
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

          // Add contact of contacts
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_ADD_CONTACT_OF_CONTACT',
            action: {
              link: () => ['/contacts-of-contacts', 'create'],
              queryParams: () => {
                return {
                  entityType: EntityType.CONTACT,
                  entityId: this.itemData?.id
                };
              }
            },
            visible: () => this.selectedOutbreakIsActive &&
              ContactModel.canCreate(this.authUser) &&
              ContactModel.canCreateContactOfContact(this.authUser) &&
              this.selectedOutbreak.isContactsOfContactsActive
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => this.selectedOutbreakIsActive &&
              ContactModel.canCreate(this.authUser) &&
              ContactModel.canCreateContactOfContact(this.authUser) &&
              this.selectedOutbreak.isContactsOfContactsActive
          },

          // Duplicate records marked as not duplicate
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_SEE_RECORDS_NOT_DUPLICATES',
            action: {
              link: () => ['/duplicated-records', 'contacts', this.itemData.id, 'marked-not-duplicates']
            },
            visible: () => ContactModel.canList(this.authUser)
          },

          // contacts
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
            action: {
              link: () => ['/relationships', EntityType.CONTACT, this.itemData.id, 'contacts']
            },
            visible: () => ContactModel.canListRelationshipContacts(this.authUser) &&
              this.selectedOutbreak.isContactsOfContactsActive
          },
          // exposures
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
            action: {
              link: () => ['/relationships', EntityType.CONTACT, this.itemData.id, 'exposures']
            },
            visible: () => CaseModel.canListRelationshipExposures(this.authUser)
          },

          // lab results
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_SEE_LAB_RESULTS',
            action: {
              link: () => ['/lab-results', 'contacts', this.itemData.id]
            },
            visible: () => ContactModel.canListLabResult(this.authUser) &&
              this.selectedOutbreak.isContactLabResultsActive
          },

          // follow-ups
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_VIEW_FOLLOW_UPS',
            action: {
              link: () => ['/contacts', 'contact-related-follow-ups', this.itemData.id]
            },
            visible: () => FollowUpModel.canList(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER
          },

          // movement map
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_VIEW_MOVEMENT',
            action: {
              link: () => ['/contacts', this.itemData.id, 'movement']
            },
            visible: () => ContactModel.canViewMovementMap(this.authUser)
          },

          // chronology chart
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_VIEW_CHRONOLOGY',
            action: {
              link: () => ['/contacts', this.itemData.id, 'chronology']
            },
            visible: () => ContactModel.canViewChronologyChart(this.authUser)
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
      const runCreateOrUpdate = (overwriteFinished: (item: ContactModel) => void) => {
        // on create we have relationship data too
        let relationship;
        if (type === CreateViewModifyV2ActionType.CREATE) {
          // cleanup
          relationship = data.relationship;
          delete data.relationship;

          // add related entity
          relationship.persons = [{
            id: this._parentEntity.id
          }];
        }

        // create / update
        (type === CreateViewModifyV2ActionType.CREATE ?
          this.personAndRelatedHelperService.contact.contactDataService
            .createContact(
              this.selectedOutbreak.id,
              data
            ) :
          this.personAndRelatedHelperService.contact.contactDataService
            .modifyContact(
              this.selectedOutbreak.id,
              this.itemData.id,
              data
            )
        ).pipe(
          // create relationship if create
          switchMap((contact: ContactModel) => {
            // nothing to do ?
            if (type !== CreateViewModifyV2ActionType.CREATE) {
              return of(contact);
            }

            // create relationship
            return this.personAndRelatedHelperService.relationship.relationshipDataService
              .createRelationship(
                this.selectedOutbreak.id,
                EntityType.CONTACT,
                contact.id,
                relationship
              )
              .pipe(
                // generate follow-ups if create
                switchMap(() => {
                  // do not generate follow-ups if the feature is not enabled
                  if (!this.selectedOutbreak.generateFollowUpsWhenCreatingContacts) {
                    return of(contact);
                  }

                  // generate follow-ups
                  return this.personAndRelatedHelperService.followUp.followUpsDataService
                    .generateFollowUps(
                      this.selectedOutbreak.id,
                      {
                        contactIds: [contact.id]
                      }
                    );
                }))
              .pipe(map(() => contact));
          }),

          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        ).subscribe((item: ContactModel) => {
          // finished
          const finishedProcessingData = () => {
            // success creating / updating
            this.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE' :
                'LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE'
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
                EntityType.CONTACT,
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
          // no duplicates - proceed to create ?
          if (
            (
              type === CreateViewModifyV2ActionType.CREATE &&
              versionData.duplicate.disableContactDuplicateCheck
            ) || (
              type === CreateViewModifyV2ActionType.UPDATE && (
                versionData.duplicate.disableContactDuplicateCheck || (
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
                // create
                return runCreateOrUpdate(undefined);
              }

              // hide loading since this will be handled further by the side dialog
              loading.hide();

              // hide notification
              // - hide alert
              this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

              // construct list of actions
              const itemsToManage: IV2SideDialogConfigInputLinkWithAction[] = response.duplicates.map((item, index) => {
                return {
                  type: V2SideDialogConfigInputType.LINK_WITH_ACTION,
                  name: `actionsLink[${item.model.id}]`,
                  placeholder: (index + 1) + '. ' + EntityModel.getDuplicatePersonDetails(
                    item,
                    this.personAndRelatedHelperService.i18nService.instant(item.model.type),
                    this.personAndRelatedHelperService.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                    this.personAndRelatedHelperService.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                  ),
                  link: () => ['/contacts', item.model.id, 'view'],
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
                        disabled: item.model.type !== EntityType.CONTACT
                      }
                    ]
                  }
                };
              });

              // construct & display duplicates dialog
              this.personAndRelatedHelperService.dialogV2Service
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
                        'LNG_PAGE_CREATE_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG' :
                        'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
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
                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT), 'merge'], {
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
      link: (item: ContactModel) => ['/contacts', item.id, 'view'],
      statusVisible: this.expandListColumnRenderer?.statusVisible === undefined ?
        true :
        this.expandListColumnRenderer.statusVisible,
      maxNoOfStatusForms: 3,
      get: {
        status: (item: ContactModel) => {
          // must initialize - optimization to not recreate the list everytime there is an event since data won't change ?
          if (!item.uiStatusForms) {
            // determine forms
            const forms: V2ColumnStatusForm[] = this.personAndRelatedHelperService.contact.getStatusForms({
              item,
              risk: this.activatedRoute.snapshot.data.risk,
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
        text: (item: ContactModel) => item.name,
        details: (item: ContactModel) => item.visualId
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
      'outcomeId',
      'riskLevel',
      'followUp',
      'questionnaireAnswers'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.personAndRelatedHelperService.contact.generateAdvancedFilters(this.selectedOutbreak, {
      contactInvestigationTemplate: () => this.selectedOutbreak.contactInvestigationTemplate,
      contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
      caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
      options: {
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        followUpStatus: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        documentType: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        investigationStatus: (this.activatedRoute.snapshot.data.investigationStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        clusterLoad: (finished) => {
          this.clusterDataService
            .getResolveList(this.selectedOutbreak.id)
            .pipe(
              // handle error
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // not found
                finished(null);

                // send error down the road
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((data) => {
              finished(data);
            });
        },
        outcome: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        dateRangeType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        dateRangeCenter: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
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
    this.expandListRecords$ = this.personAndRelatedHelperService.contact.contactDataService
      .getContactsList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
        // process data
        map((contacts: ContactModel[]) => {
          return EntityModel.determineAlertness<ContactModel>(
            this.selectedOutbreak.contactInvestigationTemplate,
            contacts
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
    this.toastV2Service.notice(
      this.personAndRelatedHelperService.i18nService.instant('LNG_CONTACT_FIELD_LABEL_DUPLICATE_PERSONS') +
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
            return `${item.model.name} (${this.personAndRelatedHelperService.i18nService.instant(item.type)})`;
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
          return `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.model.name} (${this.personAndRelatedHelperService.i18nService.instant(item.model.type)})</span></a>`;
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
          this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

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
          ).pipe(
            // handle error
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // finished
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          ).subscribe((foundPersons: EntityDuplicatesModel) => {
            // request executed
            this._duplicateCheckingSubscription = undefined;

            // update what we found
            this._personDuplicates = [];
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
   * Check if "Date of Last Contact" is before "Date of Onset" of the source case
   */
  private checkForLastContactBeforeCaseOnSet() {
    // return if the feature is disabled
    if (!this.selectedOutbreak.checkLastContactDateAgainstDateOnSet) {
      return;
    }

    // validate contact date
    if (
      (this._parentEntity as CaseModel)?.dateOfOnset &&
      this._relationship.contactDate &&
      moment(this._relationship.contactDate).isValid() &&
      moment(this._relationship.contactDate).isBefore(moment((this._parentEntity as CaseModel).dateOfOnset))
    ) {
      this.toastV2Service.notice(
        'LNG_PAGE_CREATE_CONTACT_WARNING_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET',
        {
          dateOfOnset: moment((this._parentEntity as CaseModel).dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
        },
        AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
      );
    } else {
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
    }
  }
}
