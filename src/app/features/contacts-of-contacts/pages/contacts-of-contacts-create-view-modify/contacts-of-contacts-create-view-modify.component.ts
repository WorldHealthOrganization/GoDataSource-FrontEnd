import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, of, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
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
import { AgeModel } from '../../../../core/models/age.model';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
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
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { CaseModel } from '../../../../core/models/case.model';
import { Location } from '@angular/common';

/**
 * Component
 */
@Component({
  selector: 'app-contacts-of-contacts-create-view-modify',
  templateUrl: './contacts-of-contacts-create-view-modify.component.html'
})
export class ContactsOfContactsCreateViewModifyComponent extends CreateViewModifyComponent<ContactOfContactModel> implements OnDestroy {
  // contacts of contact visual id mask
  private _cocVisualIDMask: {
    mask: string
  };

  // today
  private _today: Moment = moment();

  // check for duplicate
  private _duplicateCheckingTimeout: any;
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

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected contactsOfContactsDataService: ContactsOfContactsDataService,
    protected toastV2Service: ToastV2Service,
    protected translateService: TranslateService,
    protected dialogV2Service: DialogV2Service,
    protected entityHelperService: EntityHelperService,
    protected systemSettingsDataService: SystemSettingsDataService,
    protected entityDataService: EntityDataService,
    protected relationshipDataService: RelationshipDataService,
    protected domSanitizer: DomSanitizer,
    protected location: Location,
    authDataService: AuthDataService,
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
    if (this.isCreate) {
      this._parentEntity = this.activatedRoute.snapshot.data.entity;
    }
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
      mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
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
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_PERSONS);

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
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE', {
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

        // Relationship - Create
        this.initializeTabsRelationship(),

        // exposures ...
        this.initializeTabsExposures()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_ACTION_CREATE_CONTACT_BUTTON'),
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
    // create tab
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'personal',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
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
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  this.itemData.middleName = value;

                  // check for duplicates
                  this.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  this.itemData.lastName = value;

                  // check for duplicates
                  this.checkForPersonExistence();
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.gender,
                set: (value) => {
                  // set gender
                  this.itemData.gender = value;

                  // reset pregnancy ?
                  if (this.itemData.gender === Constants.GENDER_MALE) {
                    // reset
                    this.itemData.pregnancyStatus = null;

                    // make sure we update pregnancy too
                    tab.form.controls['pregnancyStatus'].markAsDirty();
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
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
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
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
                age: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
                dob: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB_DESCRIPTION'
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

                      // reset
                      this.itemData.dob = null;
                    }
                  },
                  months: {
                    get: () => this.itemData.age?.months,
                    set: (value) => {
                      // set value
                      this.itemData.age = this.itemData.age || new AgeModel();
                      this.itemData.age.months = value;

                      // reset
                      this.itemData.dob = null;
                    }
                  }
                },
                dob: {
                  get: () => this.itemData.dob,
                  set: (value) => {
                    // set value
                    this.itemData.dob = value;

                    // update age
                    if (
                      this.itemData.dob &&
                      (this.itemData.dob as Moment).isValid()
                    ) {
                      // add age object if we don't have one
                      this.itemData.age = this.itemData.age || new AgeModel();

                      // add data
                      const now = moment();
                      this.itemData.age.years = now.diff(this.itemData.dob, 'years');
                      this.itemData.age.months = this.itemData.age.years < 1 ? now.diff(this.itemData.dob, 'months') : 0;
                    } else {
                      this.itemData.age.months = 0;
                      this.itemData.age.years = 0;
                    }
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this._cocVisualIDMask
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
                    if (!this._cocVisualIDMask) {
                      return;
                    }

                    // generate
                    this.itemData.visualId = ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CCC_' + this.selectedOutbreak.id +
                    this._cocVisualIDMask.mask +
                    this.itemData.visualId +
                    (
                      this.isCreate ?
                        '' :
                        this.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
                      this.selectedOutbreak.id,
                      this._cocVisualIDMask.mask,
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
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this.authUser),
                html: this.translateService.instant('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS',
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
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'addresses',
            items: this.itemData.addresses,
            itemsChanged: (list) => {
              // update addresses
              this.itemData.addresses = list.items;
            },
            actionIconButtons: [
              // copy parent address
              {
                icon: 'file_copy',
                tooltip: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_ACTION_COPY_ENTITY_ADDRESS_TOOLTIP',
                click: (
                  _input,
                  addressIndex: number
                ) => {
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_COPY_PARENT_ENTITY_ADDRESS'
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // copy parent address - clone
                    this.itemData.addresses[addressIndex] = new AddressModel(this._parentEntity.mainAddress);

                    // update ui
                    this.tabsV2Component.detectChanges();
                  });
                },
                visible: () => {
                  return this.isCreate &&
                    !!this._parentEntity?.mainAddress?.typeId;
                }
              }
            ],
            definition: {
              add: {
                label: 'LNG_ADDRESS_LABEL_ADD_NEW_ADDRESS',
                newItem: () => new AddressModel({
                  date: moment().toISOString()
                })
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

    // finished
    return tab;
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'infection',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE' :
        'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            value: {
              get: () => this.itemData.isDateOfReportingApproximate,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
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
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
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
   * Initialize tabs - Relationship
   */
  private initializeTabsRelationship(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'relationship',
      label: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TAB_RELATIONSHIP_TITLE',
      visible: () => this.isCreate,
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'relationship[dateOfFirstContact]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT_DESCRIPTION',
            value: {
              get: () => this._relationship.dateOfFirstContact,
              set: (value) => {
                this._relationship.dateOfFirstContact = value;
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
            name: 'relationship[contactDate]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
            value: {
              get: () => this._relationship.contactDate,
              set: (value) => {
                this._relationship.contactDate = value;
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
            name: 'relationship[contactDateEstimated]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED_DESCRIPTION',
            value: {
              get: () => this._relationship.contactDateEstimated,
              set: (value) => {
                // set data
                this._relationship.contactDateEstimated = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[certaintyLevelId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.certaintyLevelId,
              set: (value) => {
                this._relationship.certaintyLevelId = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[exposureTypeId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.exposureTypeId,
              set: (value) => {
                this._relationship.exposureTypeId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[exposureFrequencyId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.exposureFrequencyId,
              set: (value) => {
                this._relationship.exposureFrequencyId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[exposureDurationId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.exposureDurationId,
              set: (value) => {
                this._relationship.exposureDurationId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[socialRelationshipTypeId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.socialRelationshipTypeId,
              set: (value) => {
                this._relationship.socialRelationshipTypeId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'relationship[clusterId]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this._relationship.clusterId,
              set: (value) => {
                this._relationship.clusterId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'relationship[socialRelationshipDetail]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP_DESCRIPTION',
            value: {
              get: () => this._relationship.socialRelationshipDetail,
              set: (value) => {
                this._relationship.socialRelationshipDetail = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXTAREA,
            name: 'relationship[comment]',
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT_DESCRIPTION',
            value: {
              get: () => this._relationship.comment,
              set: (value) => {
                this._relationship.comment = value;
              }
            }
          }]
        }
      ]
    };
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
          authUser: this.authUser,
          refreshList: () => {
            // reload data
            const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
            localTab.refresh(newTab);
          }
        }),
        tableColumns: this.entityHelperService.retrieveTableColumns({
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
                  this.activatedRoute.snapshot.data.user
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

          // exposures
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
            action: {
              link: () => ['/relationships', EntityType.CONTACT_OF_CONTACT, this.itemData.id, 'exposures']
            },
            visible: () => ContactOfContactModel.canListRelationshipExposures(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => ContactOfContactModel.canList(this.authUser) || ContactOfContactModel.canListRelationshipExposures(this.authUser)
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
            this.toastV2Service.success(
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
                    this.translateService.instant(item.model.type),
                    this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                    this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
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
            const forms: V2ColumnStatusForm[] = ContactOfContactModel.getStatusForms({
              item,
              translateService: this.translateService,
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
    this.expandListAdvancedFilters = ContactOfContactModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        occupation: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
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
    this.toastV2Service.notice(
      this.translateService.instant('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DUPLICATE_PERSONS') +
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
            return `${item.model.name} (${this.translateService.instant(item.type)})`;
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
          return `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.model.name} (${this.translateService.instant(item.model.type)})</span></a>`;
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
          )
          .pipe(
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
            if (foundPersons?.duplicates?.length > 0) {
              this._personDuplicates.push(
                ...foundPersons.duplicates.map((item) => item as EntityModel)
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
