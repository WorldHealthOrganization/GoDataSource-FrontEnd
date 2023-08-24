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
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputLinkWithAction, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../../../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ContactModel } from '../../../../core/models/contact.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { CaseModel } from '../../../../core/models/case.model';
import { Location } from '@angular/common';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { EntityFollowUpHelperService } from '../../../../core/services/helper/entity-follow-up-helper.service';
import { TeamModel } from '../../../../core/models/team.model';
import { EntityContactOfContactHelperService } from '../../../../core/services/helper/entity-contact-of-contact-helper.service';
import { CreateViewModifyHelperService } from '../../../../core/services/helper/create-view-modify-helper.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-contacts-of-contacts-create-view-modify',
  templateUrl: './contacts-of-contacts-create-view-modify.component.html'
})
export class ContactsOfContactsCreateViewModifyComponent extends CreateViewModifyComponent<ContactOfContactModel> implements OnDestroy {
  // constants
  private static readonly TAB_NAMES_QUESTIONNAIRE_AS_CASE: string = 'questionnaire_as_case';
  private static readonly TAB_NAMES_QUESTIONNAIRE_AS_CONTACT: string = 'questionnaire_as_contact';

  // contacts of contact visual id mask
  private _cocVisualIDMask: {
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
  private _parentEntity: ContactModel;

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
    protected contactsOfContactsDataService: ContactsOfContactsDataService,
    protected dialogV2Service: DialogV2Service,
    protected entityHelperService: EntityHelperService,
    protected systemSettingsDataService: SystemSettingsDataService,
    protected entityDataService: EntityDataService,
    protected relationshipDataService: RelationshipDataService,
    protected domSanitizer: DomSanitizer,
    protected location: Location,
    protected referenceDataHelperService: ReferenceDataHelperService,
    private entityContactOfContactHelperService: EntityContactOfContactHelperService,
    private entityFollowUpHelperService: EntityFollowUpHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      createViewModifyHelperService,
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
      .getSettings(UserSettings.CONTACT_OF_CONTACTS_GENERAL);
    const hideQuestionNumbers: {
      [key: string]: any
    } = generalSettings && generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS] ?
      generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS][CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS] :
      undefined;

    // use the saved options
    this.hideCaseQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[ContactsOfContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE] : false;
    this.hideContactQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[ContactsOfContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT] : false;
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
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): ContactOfContactModel {
    return new ContactOfContactModel({
      addresses: [new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS,
        date: moment().toISOString()
      })]
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: ContactOfContactModel): Observable<ContactOfContactModel> {
    return this.contactsOfContactsDataService
      .getContactOfContact(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.contactOfContactId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // initialize visual ID mask
    this._cocVisualIDMask = {
      mask: this.entityContactOfContactHelperService.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
    };

    // set visual id
    this.itemData.visualId = this.isCreate ?
      this._cocVisualIDMask.mask :
      this.itemData.visualId;

    // initialize relationship
    if (this.isCreate) {
      this._relationship = new RelationshipModel();
    }

    // check if record has duplicate
    if (
      this.isView ||
      this.isModify
    ) {
      // remove global notifications
      this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

      // show global notifications
      this.checkForPersonExistence();
    }
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE';
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
      // contact list page
      if (ContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        });
      }

      // contact view page
      if (ContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._parentEntity.name,
          action: {
            link: [`/contacts/${this._parentEntity.id}/view`]
          }
        });
      }
    }

    // contact of contacts list page
    if (ContactOfContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE', {
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE',
        tooltip: this.itemData.dateBecomeContactOfContact ?
          `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT_OF_CONTACT')}: ${moment(this.itemData.dateBecomeContactOfContact).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
          undefined
      });
    }

    // was contact ?
    if (this.itemData.wasContact) {
      this.breadcrumbInfos.push({
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CONTACT',
        tooltip: this.itemData.dateBecomeContactOfContact ?
          `${this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT_OF_CONTACT')}: ${moment(this.itemData.dateBecomeContactOfContact).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}` :
          undefined
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
        this.initializeTabsEpidemiology(),

        // Relationship - Create
        this.initializeTabsRelationship(),

        // Questionnaires
        this.initializeTabsQuestionnaireAsCase(),
        this.initializeTabsQuestionnaireAsContact(),

        // contacts and exposures ...
        this.initializeTabsContacts(),
        this.initializeTabsExposures(),
        this.initializeTabsViewFollowUps()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_ACTION_CREATE_CONTACT_BUTTON'),
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
        data: ContactOfContactModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/contacts-of-contacts',
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
    return this.entityContactOfContactHelperService.generateTabsPersonal(this.selectedOutbreak, {
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
      cocVisualIDMask: this._cocVisualIDMask,
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
    return this.entityContactOfContactHelperService.generateTabsEpidemiology(this.selectedOutbreak, {
      isCreate: this.isCreate,
      itemData: this.itemData,
      options: {
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
        )
      }
    });
  }

  /**
   * Initialize tabs - Relationship
   */
  private initializeTabsRelationship(): ICreateViewModifyV2Tab {
    return this.entityHelperService.generateTabsDetails(this.selectedOutbreak, {
      entityId: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
      tabName: 'details',
      tabLabel: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_RELATIONSHIP_TITLE',
      tabVisible: () => {
        return this.isCreate;
      },
      inputName: (property) => `relationship[${property}]`,
      itemData: this._relationship,
      createCopySuffixButtons: () => undefined,
      checkForLastContactBeforeCaseOnSet: () => {},
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
   * Initialize tabs - Case Questionnaire
   */
  private initializeTabsQuestionnaireAsCase(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: ContactsOfContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CASE,
      label: `${this.createViewModifyHelperService.i18nService.instant(EntityType.CASE)} ${this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_CASE_QUESTIONNAIRE_TITLE')}`,
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
   * Initialize tabs - Contact Questionnaire
   */
  private initializeTabsQuestionnaireAsContact(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: ContactsOfContactsCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE_AS_CONTACT,
      label: `${this.createViewModifyHelperService.i18nService.instant(EntityType.CONTACT)} ${this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_CONTACT_QUESTIONNAIRE_TITLE')}`,
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
        ContactOfContactModel.canListRelationshipContacts(this.authUser),
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
        ContactOfContactModel.canListRelationshipExposures(this.authUser),
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
        advancedFilters: this.entityFollowUpHelperService.generateAdvancedFilters({
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
          link: () => ['/contacts-of-contacts', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/contacts-of-contacts', this.itemData?.id, 'modify']
        },
        visible: () => ContactOfContactModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/contacts-of-contacts']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/contacts-of-contacts']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/contacts-of-contacts']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
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

          // Duplicate records marked as not duplicate
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_SEE_RECORDS_NOT_DUPLICATES',
            action: {
              link: () => ['/duplicated-records', 'contacts-of-contacts', this.itemData.id, 'marked-not-duplicates']
            },
            visible: () => ContactOfContactModel.canList(this.authUser)
          },

          // contacts
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
            action: {
              link: () => ['/relationships', EntityType.CONTACT_OF_CONTACT, this.itemData.id, 'contacts']
            },
            visible: () => ContactOfContactModel.canListRelationshipContacts(this.authUser)
          },

          // exposures
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
            action: {
              link: () => ['/relationships', EntityType.CONTACT_OF_CONTACT, this.itemData.id, 'exposures']
            },
            visible: () => ContactOfContactModel.canListRelationshipExposures(this.authUser)
          },

          // follow-ups
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_FOLLOW_UPS',
            action: {
              link: () => ['/contacts', 'contact-of-contact-related-follow-ups', this.itemData.id]
            },
            visible: () => FollowUpModel.canList(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => ContactOfContactModel.canList(this.authUser) ||
              ContactOfContactModel.canListRelationshipContacts(this.authUser) ||
              ContactOfContactModel.canListRelationshipExposures(this.authUser) ||
              FollowUpModel.canList(this.authUser)
          },

          // movement map
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_VIEW_MOVEMENT',
            action: {
              link: () => ['/contacts-of-contacts', this.itemData.id, 'movement']
            },
            visible: () => ContactOfContactModel.canViewMovementMap(this.authUser)
          },

          // chronology chart
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_VIEW_CHRONOLOGY',
            action: {
              link: () => ['/contacts-of-contacts', this.itemData.id, 'chronology']
            },
            visible: () => ContactOfContactModel.canViewChronologyChart(this.authUser)
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
      const runCreateOrUpdate = (overwriteFinished: (item: ContactOfContactModel) => void) => {
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
          this.contactsOfContactsDataService
            .createContactOfContact(
              this.selectedOutbreak.id,
              data
            ) :
          this.contactsOfContactsDataService
            .modifyContactOfContact(
              this.selectedOutbreak.id,
              this.itemData.id,
              data
            )
        ).pipe(
          // create relationship if create
          switchMap((coc: ContactOfContactModel) => {
            // nothing to do ?
            if (type !== CreateViewModifyV2ActionType.CREATE) {
              return of(coc);
            }

            // create relationship
            return this.relationshipDataService
              .createRelationship(
                this.selectedOutbreak.id,
                EntityType.CONTACT_OF_CONTACT,
                coc.id,
                relationship
              )
              .pipe(map(() => coc));
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
        ).subscribe((item: ContactOfContactModel) => {
          // finished
          const finishedProcessingData = () => {
            // success creating / updating case
            this.createViewModifyHelperService.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_CREATE_CONTACT_OF_CONTACT_SUCCESS_MESSAGE' :
                'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_MODIFY_CONTACT_OF_CONTACT_SUCCESS_MESSAGE'
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
                EntityType.CONTACT_OF_CONTACT,
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
              versionData.duplicate.disableContactOfContactDuplicateCheck
            ) || (
              type === CreateViewModifyV2ActionType.UPDATE && (
                versionData.duplicate.disableContactOfContactDuplicateCheck || (
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
                  link: () => ['/contacts-of-contacts', item.model.id, 'view'],
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
                        disabled: item.model.type !== EntityType.CONTACT_OF_CONTACT
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
                        'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG' :
                        'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
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
                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT_OF_CONTACT), 'merge'], {
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
      link: (item: ContactOfContactModel) => ['/contacts-of-contacts', item.id, 'view'],
      statusVisible: this.expandListColumnRenderer?.statusVisible === undefined ?
        true :
        this.expandListColumnRenderer.statusVisible,
      maxNoOfStatusForms: 1,
      get: {
        status: (item: ContactOfContactModel) => {
          // must initialize - optimization to not recreate the list everytime there is an event since data won't change ?
          if (!item.uiStatusForms) {
            // determine forms
            const forms: V2ColumnStatusForm[] = this.entityContactOfContactHelperService.getStatusForms({
              item,
              risk: this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>
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
        text: (item: ContactOfContactModel) => item.name,
        details: (item: ContactOfContactModel) => item.visualId
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
      'riskLevel'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.entityContactOfContactHelperService.generateAdvancedFilters({
      options: {
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        documentType: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
    this.expandListRecords$ = this.contactsOfContactsDataService
      .getContactsOfContactsList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
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
      this.createViewModifyHelperService.i18nService.instant('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DUPLICATE_PERSONS') +
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
   * Check if a contact of contact exists with the same name
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
}
