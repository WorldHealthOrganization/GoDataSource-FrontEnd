import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable, ICreateViewModifyV2TabTableRecordsList
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { AgeModel } from '../../../../core/models/age.model';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { Subscription } from 'rxjs/internal/Subscription';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { Location } from '@angular/common';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { TeamModel } from '../../../../core/models/team.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { EntityFollowUpHelperService } from '../../../../core/services/helper/entity-follow-up-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-contacts-create-view-modify',
  templateUrl: './contacts-create-view-modify.component.html'
})
export class ContactsCreateViewModifyComponent extends CreateViewModifyComponent<ContactModel> implements OnDestroy {
  // contact visual id mask
  private _contactVisualIDMask: {
    mask: string
  };

  // today
  private _today: Moment = moment();

  // check for duplicate
  private _duplicateCheckingTimeout: any;
  private _duplicateCheckingSubscription: Subscription;
  private _personDuplicates: (ContactModel | CaseModel)[] = [];
  private _previousChecked: {
    firstName: string,
    lastName: string,
    middleName: string
  } = {
      firstName: '',
      lastName: '',
      middleName: ''
    };

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected contactDataService: ContactDataService,
    protected caseDataService: CaseDataService,
    protected translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    protected location: Location,
    protected dialogV2Service: DialogV2Service,
    protected entityHelperService: EntityHelperService,
    protected entityFollowUpHelperService: EntityFollowUpHelperService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );
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
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): ContactModel {
    return new ContactModel({
      addresses: [new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS
      })]
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: ContactModel): Observable<ContactModel> {
    return this.contactDataService
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
      mask: ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
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
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);

      // check
      this.checkForPersonExistence();
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

    // case list page
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
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_CONTACT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_CONTACT_TITLE', {
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
        this.initializeTabsEpidemiology(),

        // Questionnaires
        this.initializeTabsQuestionnaire(),
        this.initializeTabsQuestionnaireAsCase(),

        // Contacts, exposures ...
        this.initializeTabsContacts(),
        this.initializeTabsExposures(),
        this.initializeTabsViewFollowUps()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_BUTTON'),
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
      redirectAfterCreateUpdate: (data: ContactModel) => {
        // redirect to view
        this.router.navigate([
          '/contacts',
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
      label: this.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_TAB_PERSONAL_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  // set data
                  this.itemData.firstName = value;

                  // check for duplicates
                  this.checkForPersonExistence();
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'middleName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  // set data
                  this.itemData.middleName = value;

                  // check for duplicates
                  this.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  // set data
                  this.itemData.lastName = value;

                  // check for duplicates
                  this.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
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
                age: 'LNG_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
                dob: 'LNG_CONTACT_FIELD_LABEL_DOB_DESCRIPTION'
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
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this._contactVisualIDMask
              ),
              value: {
                get: () => this.itemData.visualId,
                set: (value) => {
                  this.itemData.visualId = value;
                }
              },
              suffixIconButtons: [
                {
                  icon: 'refresh',
                  tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                  clickAction: (input) => {
                    // nothing to do ?
                    if (!this._contactVisualIDMask) {
                      return;
                    }

                    // generate
                    this.itemData.visualId = ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CCO_' + this.selectedOutbreak.id +
                    this._contactVisualIDMask.mask +
                    this.itemData.visualId +
                    (
                      this.isCreate ?
                        '' :
                        this.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.contactDataService.checkContactVisualIDValidity(
                      this.selectedOutbreak.id,
                      this._contactVisualIDMask.mask,
                      this.itemData.visualId,
                      this.isCreate ?
                        undefined :
                        this.itemData.id
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
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canList(this.authUser),
                html: this.translateService.instant('LNG_PAGE_CREATE_CONTACT_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_FIELD_LABEL_DOCUMENTS',
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
          label: 'LNG_PAGE_CREATE_CONTACT_TAB_ADDRESS_TITLE',
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
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: this.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_TAB_INFECTION_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => this.itemData.isDateOfReportingApproximate,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            value: {
              get: () => this.itemData.riskReason,
              set: (value) => {
                this.itemData.riskReason = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'followUpTeamId',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
            description: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
            value: {
              get: () => this.itemData.followUpTeamId,
              set: (value) => {
                this.itemData.followUpTeamId = value;
              }
            },
            replace: {
              condition: () => !TeamModel.canList(this.authUser),
              html: this.translateService.instant('LNG_PAGE_CREATE_CONTACT_CANT_SET_FOLLOW_UP_TEAM_TITLE')
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'followUp[status]',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
            description: () => 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this.itemData.followUp?.status,
              set: (value) => {
                // initialize
                if (!this.itemData.followUp) {
                  this.itemData.followUp = {} as any;
                }

                // set data
                this.itemData.followUp.status = value;
              }
            }
          }]
        },

        // Vaccines
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
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
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: `${this.translateService.instant(EntityType.CONTACT)} ${this.translateService.instant('LNG_PAGE_MODIFY_CONTACT_TAB_CASE_QUESTIONNAIRE_TITLE')}`,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswersCase',
        questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswersCase,
          set: () => {}
        },
        updateErrors: () => {}
      },
      visible: () => this.isView &&
        this.selectedOutbreak.caseInvestigationTemplate?.length > 0 &&
        this.itemData.wasCase &&
        this.itemData.hasQuestionnaireAnswersCase
    };
  }

  /**
   * Initialize tabs - Contacts
   */
  private initializeTabsContacts(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
      visible: () => this.isView &&
        ContactModel.canListRelationshipContacts(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumns: this.entityHelperService
          .retrieveTableColumns({
            selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
            selectedOutbreak: () => this.selectedOutbreak,
            entity: this.itemData,
            relationshipType: RelationshipType.CONTACT,
            authUser: this.authUser,
            personType: this.activatedRoute.snapshot.data.personType,
            cluster: this.activatedRoute.snapshot.data.cluster,
            options: {
              certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
            },
            refreshList: () => {
              // reload data
              const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
              localTab.refresh(newTab);
            }
          }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options
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
      label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
      visible: () => this.isView &&
        ContactModel.canListRelationshipExposures(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumns: this.entityHelperService
          .retrieveTableColumns({
            selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
            selectedOutbreak: () => this.selectedOutbreak,
            entity: this.itemData,
            relationshipType: RelationshipType.EXPOSURE,
            authUser: this.authUser,
            personType: this.activatedRoute.snapshot.data.personType,
            cluster: this.activatedRoute.snapshot.data.cluster,
            options: {
              certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
            },
            refreshList: () => {
              // reload data
              const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
              localTab.refresh(newTab);
            }
          }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options
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
      label: 'LNG_PAGE_MODIFY_CONTACT_ACTION_VIEW_FOLLOW_UPS',
      visible: () => this.isView &&
        FollowUpModel.canList(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.CONTACT_DAILY_FOLLOW_UP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.INDIVIDUAL_CONTACT_FOLLOW_UPS.value,
        tableColumns: this.entityFollowUpHelperService.retrieveTableColumns({
          authUser: this.authUser,
          entityData: this.itemData,
          selectedOutbreak: () => this.selectedOutbreak,
          selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
          team: this.activatedRoute.snapshot.data.team,
          user: this.activatedRoute.snapshot.data.user,
          options: {
            dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
          },
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        advancedFilters: this.entityFollowUpHelperService.generateAdvancedFilters({
          authUser: this.authUser,
          contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
          options: {
            team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
            yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
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
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            },
            visible: () => !this.isCreate
          }

          // #TODO
          // // Divider
          // {
          //   type: CreateViewModifyV2MenuType.DIVIDER,
          //   visible: () => !this.isCreate
          // },
          //
          // // Add contact
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_ACTION_ADD_CONTACT',
          //   action: {
          //     link: () => ['/contacts', 'create'],
          //     queryParams: () => {
          //       return {
          //         entityType: EntityType.CASE,
          //         entityId: this.itemData?.id
          //       };
          //     }
          //   },
          //   visible: () => this.selectedOutbreakIsActive && CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          // },
          //
          // // Divider
          // {
          //   type: CreateViewModifyV2MenuType.DIVIDER,
          //   visible: () => this.selectedOutbreakIsActive && CaseModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          // },
          //
          // // Duplicate records marked as not duplicate
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_SEE_RECORDS_NOT_DUPLICATES',
          //   action: {
          //     link: () => ['/duplicated-records', 'cases', this.itemData.id, 'marked-not-duplicates']
          //   },
          //   visible: () => CaseModel.canList(this.authUser)
          // },
          //
          // // contacts
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
          //   action: {
          //     link: () => ['/relationships', EntityType.CASE, this.itemData.id, 'contacts']
          //   },
          //   visible: () => CaseModel.canListRelationshipContacts(this.authUser)
          // },
          // // exposures
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
          //   action: {
          //     link: () => ['/relationships', EntityType.CASE, this.itemData.id, 'exposures']
          //   },
          //   visible: () => CaseModel.canListRelationshipExposures(this.authUser)
          // },
          //
          // // lab results
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_SEE_LAB_RESULTS',
          //   action: {
          //     link: () => ['/lab-results', 'cases', this.itemData.id]
          //   },
          //   visible: () => LabResultModel.canList(this.authUser) && CaseModel.canListLabResult(this.authUser)
          // },
          //
          // // follow-ups
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_FOLLOW_UPS',
          //   action: {
          //     link: () => ['/contacts', 'case-related-follow-ups', this.itemData.id]
          //   },
          //   visible: () => FollowUpModel.canList(this.authUser)
          // },
          //
          // // Divider
          // {
          //   type: CreateViewModifyV2MenuType.DIVIDER,
          //   visible: () => CaseModel.canList(this.authUser) || CaseModel.canListRelationshipContacts(this.authUser) ||
          //     CaseModel.canListRelationshipExposures(this.authUser) || (LabResultModel.canList(this.authUser) && CaseModel.canListLabResult(this.authUser)) ||
          //     FollowUpModel.canList(this.authUser)
          // },
          //
          // // movement map
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_MOVEMENT',
          //   action: {
          //     link: () => ['/cases', this.itemData.id, 'movement']
          //   },
          //   visible: () => CaseModel.canViewMovementMap(this.authUser)
          // },
          //
          // // chronology chart
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CHRONOLOGY',
          //   action: {
          //     link: () => ['/cases', this.itemData.id, 'chronology']
          //   },
          //   visible: () => CaseModel.canViewChronologyChart(this.authUser)
          // },
          //
          // // Divider
          // {
          //   type: CreateViewModifyV2MenuType.DIVIDER,
          //   visible: () => CaseModel.canViewMovementMap(this.authUser) || CaseModel.canViewChronologyChart(this.authUser)
          // },
          //
          // // Contact group
          // {
          //   type: CreateViewModifyV2MenuType.GROUP,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CASE_WAS_CONTACT_TITLE',
          //   visible: () => this.itemData.wasContact && (
          //     this.itemData.hasQuestionnaireAnswersContact ||
          //     FollowUpModel.canList(this.authUser)
          //   )
          // },
          // // case => contact follow-ups
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_ACTION_VIEW_CONTACT_FOLLOW_UPS',
          //   action: {
          //     link: () => ['/contacts', 'case-follow-ups', this.itemData.id]
          //   },
          //   visible: () => this.itemData.wasContact && FollowUpModel.canList(this.authUser)
          // }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  // #TODO
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      _finished,
      _loading,
      _forms
    ) => {
      // // items marked as not duplicates
      // let itemsMarkedAsNotDuplicates: string[];
      //
      // // create / update
      // const runCreateOrUpdate = (overwriteFinished: (item: CaseModel) => void) => {
      //   // attach custom id if we have one
      //   if (
      //     type === CreateViewModifyV2ActionType.CREATE &&
      //     this.customCaseUUID
      //   ) {
      //     data.id = this.customCaseUUID;
      //   }
      //
      //   // create / update
      //   (type === CreateViewModifyV2ActionType.CREATE ?
      //       this.caseDataService
      //         .createCase(
      //           this.selectedOutbreak.id,
      //           data
      //         ) :
      //       this.caseDataService
      //         .modifyCase(
      //           this.selectedOutbreak.id,
      //           this.itemData.id,
      //           data
      //         )
      //   ).pipe(
      //     // handle error
      //     catchError((err) => {
      //       // show error
      //       finished(err, undefined);
      //
      //       // finished
      //       return throwError(err);
      //     }),
      //
      //     // should be the last pipe
      //     takeUntil(this.destroyed$)
      //   ).subscribe((item: CaseModel) => {
      //     // finished
      //     const finishedProcessingData = () => {
      //       // success creating / updating case
      //       this.toastV2Service.success(
      //         type === CreateViewModifyV2ActionType.CREATE ?
      //           'LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE' :
      //           'LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE'
      //       );
      //
      //       // finished with success
      //       if (!overwriteFinished) {
      //         finished(undefined, item);
      //       } else {
      //         // mark pristine
      //         forms.markFormsAsPristine();
      //
      //         // hide loading
      //         loading.hide();
      //
      //         // call overwrite
      //         overwriteFinished(item);
      //       }
      //     };
      //
      //     // there are no records marked as NOT duplicates ?
      //     if (
      //       !itemsMarkedAsNotDuplicates ||
      //       itemsMarkedAsNotDuplicates.length < 1
      //     ) {
      //       finishedProcessingData();
      //     } else {
      //       // mark records as not duplicates
      //       this.entityDataService
      //         .markPersonAsOrNotADuplicate(
      //           this.selectedOutbreak.id,
      //           EntityType.CASE,
      //           item.id,
      //           itemsMarkedAsNotDuplicates
      //         )
      //         .pipe(
      //           // handle error
      //           catchError((err) => {
      //             // show error
      //             finished(err, undefined);
      //
      //             // send error further
      //             return throwError(err);
      //           }),
      //
      //           // should be the last pipe
      //           takeUntil(this.destroyed$)
      //         )
      //         .subscribe(() => {
      //           // finished
      //           finishedProcessingData();
      //         });
      //     }
      //   });
      // };
      //
      // // check if we need to determine duplicates
      // this.systemSettingsDataService
      //   .getAPIVersion()
      //   .pipe(
      //     // handle error
      //     catchError((err) => {
      //       // show error
      //       finished(err, undefined);
      //
      //       // send down
      //       return throwError(err);
      //     }),
      //
      //     // should be the last pipe
      //     takeUntil(this.destroyed$)
      //   )
      //   .subscribe((versionData) => {
      //     // no duplicates - proceed to create case ?
      //     if (
      //       (
      //         type === CreateViewModifyV2ActionType.CREATE &&
      //         versionData.duplicate.disableCaseDuplicateCheck
      //       ) || (
      //         type === CreateViewModifyV2ActionType.UPDATE && (
      //           versionData.duplicate.disableCaseDuplicateCheck || (
      //             versionData.duplicate.executeCheckOnlyOnDuplicateDataChange &&
      //             !EntityModel.duplicateDataHasChanged(data)
      //           )
      //         )
      //       )
      //     ) {
      //       // no need to check for duplicates
      //       return runCreateOrUpdate(undefined);
      //     }
      //
      //     // check for duplicates
      //     this.caseDataService
      //       .findDuplicates(
      //         this.selectedOutbreak.id,
      //         this.isCreate ?
      //           data : {
      //             ...this.itemData,
      //             ...data
      //           }
      //       )
      //       .pipe(
      //         catchError((err) => {
      //           // specific error
      //           if (_.includes(_.get(err, 'details.codes.id'), 'uniqueness')) {
      //             finished('LNG_PAGE_CREATE_CASE_ERROR_UNIQUE_ID', undefined);
      //           } else {
      //             finished(err, undefined);
      //           }
      //
      //           // send down
      //           return throwError(err);
      //         }),
      //
      //         // should be the last pipe
      //         takeUntil(this.destroyed$)
      //       )
      //       .subscribe((response) => {
      //         // no duplicates ?
      //         if (response.duplicates.length < 1) {
      //           // create case
      //           return runCreateOrUpdate(undefined);
      //         }
      //
      //         // hide loading since this will be handled further by the side dialog
      //         loading.hide();
      //
      //         // hide notification
      //         // - hide alert
      //         this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);
      //
      //         // construct list of actions
      //         const itemsToManage: IV2SideDialogConfigInputLinkWithAction[] = response.duplicates.map((item, index) => {
      //           return {
      //             type: V2SideDialogConfigInputType.LINK_WITH_ACTION,
      //             name: `actionsLink[${item.model.id}]`,
      //             placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
      //               item.model as CaseModel,
      //               this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
      //               this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      //             ),
      //             link: () => ['/cases', item.model.id, 'view'],
      //             actions: {
      //               type: V2SideDialogConfigInputType.TOGGLE,
      //               name: `actionsAction[${item.model.id}]`,
      //               value: Constants.DUPLICATE_ACTION.NO_ACTION,
      //               data: item.model.id,
      //               options: [
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.NO_ACTION,
      //                   value: Constants.DUPLICATE_ACTION.NO_ACTION
      //                 },
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE,
      //                   value: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE
      //                 },
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.MERGE,
      //                   value: Constants.DUPLICATE_ACTION.MERGE
      //                 }
      //               ]
      //             }
      //           };
      //         });
      //
      //         // construct & display duplicates dialog
      //         this.dialogV2Service
      //           .showSideDialog({
      //             title: {
      //               get: () => 'LNG_COMMON_LABEL_HAS_DUPLICATES_TITLE'
      //             },
      //             hideInputFilter: true,
      //             dontCloseOnBackdrop: true,
      //             width: '55rem',
      //             inputs: [
      //               // Title
      //               {
      //                 type: V2SideDialogConfigInputType.DIVIDER,
      //                 placeholder: this.isCreate ?
      //                   'LNG_PAGE_CREATE_CASE_DUPLICATES_DIALOG_CONFIRM_MSG' :
      //                   'LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
      //                 placeholderMultipleLines: true
      //               },
      //
      //               // Actions
      //               ...itemsToManage
      //             ],
      //             bottomButtons: [{
      //               type: IV2SideDialogConfigButtonType.OTHER,
      //               label: 'LNG_COMMON_BUTTON_SAVE',
      //               color: 'primary'
      //             }, {
      //               type: IV2SideDialogConfigButtonType.CANCEL,
      //               label: 'LNG_COMMON_BUTTON_CANCEL',
      //               color: 'text'
      //             }]
      //           })
      //           .subscribe((dialogResponse) => {
      //             // cancelled ?
      //             if (dialogResponse.button.type === IV2SideDialogConfigButtonType.CANCEL) {
      //               // show back duplicates alert
      //               this.showDuplicatesAlert();
      //
      //               // finished
      //               return;
      //             }
      //
      //             // determine number of items to merge / mark as not duplicates
      //             const itemsToMerge: string[] = [];
      //             itemsMarkedAsNotDuplicates = [];
      //
      //             // go through items to manage
      //             dialogResponse.data.inputs.forEach((item) => {
      //               // not important ?
      //               if (item.type !== V2SideDialogConfigInputType.LINK_WITH_ACTION) {
      //                 return;
      //               }
      //
      //               // take action
      //               switch (item.actions.value) {
      //                 case Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE:
      //                   itemsMarkedAsNotDuplicates.push(item.actions.data);
      //                   break;
      //                 case Constants.DUPLICATE_ACTION.MERGE:
      //                   itemsToMerge.push(item.actions.data);
      //                   break;
      //               }
      //             });
      //
      //             // hide dialog
      //             dialogResponse.handler.hide();
      //
      //             // show back loading
      //             loading.show();
      //
      //             // save data first, followed by redirecting to merge
      //             if (itemsToMerge.length > 0) {
      //               runCreateOrUpdate((item) => {
      //                 // construct list of ids
      //                 const mergeIds: string[] = [
      //                   item.id,
      //                   ...itemsToMerge
      //                 ];
      //
      //                 // redirect to merge
      //                 this.router.navigate(
      //                   ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CASE), 'merge'], {
      //                     queryParams: {
      //                       ids: JSON.stringify(mergeIds)
      //                     }
      //                   }
      //                 );
      //               });
      //             } else {
      //               runCreateOrUpdate(undefined);
      //             }
      //           });
      //       });
      //   });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: ContactModel) => item.name,
      link: (item: ContactModel) => ['/contacts', item.id, 'view']
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
      'middleName'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = ContactModel.generateAdvancedFilters({
      authUser: this.authUser,
      contactInvestigationTemplate: () => this.selectedOutbreak.contactInvestigationTemplate,
      contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
      caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
      options: {
        occupation: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        followUpStatus: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        pregnancyStatus: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        vaccine: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        vaccineStatus: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
    this.expandListRecords$ = this.contactDataService
      .getContactsList(
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
    this.toastV2Service.notice(
      this.translateService.instant('LNG_CONTACT_FIELD_LABEL_DUPLICATE_CASES') +
      ' ' +
      this._personDuplicates
        .map((item) => {
          // check rights
          if (
            (
              item.type === EntityType.CONTACT &&
              !ContactModel.canView(this.authUser)
            ) || (
              item.type === EntityType.CASE &&
              !CaseModel.canView(this.authUser)
            )
          ) {
            return `${item.name} (${this.translateService.instant(item.type)})`;
          }

          // create url
          const url: string = `${item.type === EntityType.CONTACT ? '/contacts' : '/cases'}/${item.id}/view`;

          // finished
          return `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.name} (${this.translateService.instant(item.type)})</span></a>`;
        })
        .join(', '),
      undefined,
      AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT
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
          this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);

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
        this._duplicateCheckingSubscription = forkJoin([
          this.contactDataService
            .findDuplicates(
              this.selectedOutbreak.id,
              this.isView || this.isModify ?
                {
                  id: this.itemData.id,
                  ...this._previousChecked
                } :
                this._previousChecked
            ),
          this.caseDataService
            .findDuplicates(
              this.selectedOutbreak.id,
              this._previousChecked
            )
        ]).pipe(
          // handle error
          catchError((err) => {
            // show error
            this.toastV2Service.error(err);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        ).subscribe((
          [foundContacts, foundCases]: [
            EntityDuplicatesModel,
            EntityDuplicatesModel
          ]
        ) => {
          // request executed
          this._duplicateCheckingSubscription = undefined;

          // update what we found
          this._personDuplicates = [];
          if (foundContacts?.duplicates?.length > 0) {
            this._personDuplicates.push(
              ...foundContacts.duplicates.map((item) => item.model as ContactModel)
            );
          }
          if (foundCases?.duplicates?.length > 0) {
            this._personDuplicates.push(
              ...foundCases.duplicates.map((item) => item.model as CaseModel)
            );
          }

          // update alert
          updateAlert();
        });
      },
      400
    );
  }
}
