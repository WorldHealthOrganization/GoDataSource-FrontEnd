import * as _ from 'lodash';
import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DocumentModel } from '../../../../core/models/document.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { Observable, throwError } from 'rxjs';
import { moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ICreateViewModifyV2Refresh } from '../../../../shared/components-v2/app-create-view-modify-v2/models/refresh.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { AgeModel } from '../../../../core/models/age.model';
import { TranslateService } from '@ngx-translate/core';
import { UserModel } from '../../../../core/models/user.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
  selector: 'app-contact-merge-duplicate-records',
  templateUrl: './contact-merge-duplicate-records.component.html'
})
export class ContactMergeDuplicateRecordsComponent extends CreateViewModifyComponent<ContactModel> implements OnDestroy {
  // data
  mergeRecordIds: string[];
  mergeRecords: EntityModel[];
  questionnaireAnswers: {
    options: LabelValuePair[]
  } = { options: [] };

  /**
   * Constructor
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    protected toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    protected translateService: TranslateService,
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

    // retrieve contacts ids
    this.mergeRecordIds = JSON.parse(this.activatedRoute.snapshot.queryParams.ids);
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
  protected createNewItem(): ContactModel {
    return null;
  }

  /**
    * Retrieve item
    */
  protected retrieveItem(_record?: ContactModel): Observable<ContactModel> {
    return new Observable<ContactModel>((subscriber) => {
      // retrieve records
      const qb = new RequestQueryBuilder();
      qb.filter.bySelect(
        'id',
        this.mergeRecordIds,
        true,
        null
      );
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((recordMerge) => {
          // merge records
          this.mergeRecords = recordMerge;

          // Complete Observable
          subscriber.next(new ContactModel());
          subscriber.complete();
        });
    });
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    this.pageTitle = 'LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE';
    this.pageTitleData = undefined;
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE',
        action: {
          link: ['/duplicated-records']
        }
      },
      {
        label: 'LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE',
        action: null
      }
    ];
  }

  /**
     * Initialize tabs
     */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabPersonal(),

        // Epidemiology
        this.initializeTabEpidemiology(),

        // // Questionnaires
        this.initializeTabQuestionnaire()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect to view
        this.redirectService.to(['/duplicated-records']);
      }
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
  * Initialize expand list query fields
  */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(_data: ICreateViewModifyV2Refresh): void {}

  /**
   * Initialize tabs - Personal
   */
  private initializeTabPersonal(): ICreateViewModifyV2Tab {
    // merge all records documents
    this.determineDocuments();

    // merge all records documents
    this.determineAddresses();

    // create tab
    return  {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              options: this.getFieldOptions('firstName').options,
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  // set data
                  this.itemData.firstName = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'middleName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              options: this.getFieldOptions('middleName').options,
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  // set data
                  this.itemData.middleName = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              options: this.getFieldOptions('lastName').options,
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  // set data
                  this.itemData.lastName = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
              options: this.getFieldOptions('gender').options,
              value: {
                get: () => this.itemData.gender,
                set: (value) => {
                  // set gender
                  this.itemData.gender = value;

                  // reset pregnancy ?
                  if (this.itemData.gender === Constants.GENDER_MALE) {
                    // reset
                    this.itemData.pregnancyStatus = null;
                  }
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
              options: this.getFieldOptions('pregnancyStatus').options,
              value: {
                get: () => this.itemData.pregnancyStatus,
                set: (value) => {
                  this.itemData.pregnancyStatus = value;
                }
              },
              disabled: () => {
                return this.itemData.gender === Constants.GENDER_MALE;
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'occupation',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
              options: this.getFieldOptions('occupation').options,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'age',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_AGE',
              description: () => 'LNG_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
              options: this.getFieldOptions('age').options,
              value: {
                // #TODO: Value is displayed in dropdown only after it's selected twice in a row, please investigate
                // May be because value is of type "ICreateViewModifyV2TabInputValue<string>" instead of "ICreateViewModifyV2TabInputValue<any>"
                get: () => EntityModel.getAgeString(
                  this.itemData.age,
                  this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                  this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                ),
                set: (value: any) => {
                  // set value
                  this.itemData.age = value || new AgeModel();
                }
              },
              disabled: () => !!this.itemData.dob
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'dob',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DOB',
              description: () => 'LNG_CONTACT_FIELD_LABEL_DOB_DESCRIPTION',
              options: this.getFieldOptions('dob').options,
              value: {
                get: () => this.itemData.dob?.toString(),
                set: (value) => {
                  // set value
                  this.itemData.dob = value;
                }
              },
              disabled: () => this.itemData.age.years !== 0 || this.itemData.age.months !== 0
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this.selectedOutbreak.contactIdMask
              ),
              options: this.getFieldOptions('visualId').options,
              value: {
                get: () => this.itemData.visualId,
                set: (value) => {
                  this.itemData.visualId = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: this.getFieldOptions('responsibleUserId').options,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this.authUser),
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
  private initializeTabEpidemiology(): ICreateViewModifyV2Tab {
    // merge all records vaccines
    this.determineVaccines();

    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_MODIFY_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            options: this.getFieldOptions('dateOfReporting').options,
            value: {
              get: () => this.itemData.dateOfReporting?.toString(),
              set: (value) => {
                this.itemData.dateOfReporting = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'isDateOfReportingApproximate',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            options: this.getFieldOptions('isDateOfReportingApproximate').options,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate === undefined ?
                'LNG_COMMON_LABEL_NONE' :
                (
                  this.itemData.isDateOfReportingApproximate === true ?
                    'LNG_COMMON_LABEL_YES' :
                    'LNG_COMMON_LABEL_NO'
                ),
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value === 'LNG_COMMON_LABEL_YES' ?
                  true :
                  (
                    value === 'LNG_COMMON_LABEL_NO' ?
                      false :
                      undefined
                  );
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: this.getFieldOptions('riskLevel').options,
            value: {
              get: () => this.itemData.riskLevel,
              set: (value) => {
                this.itemData.riskLevel = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskReason',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            options: this.getFieldOptions('riskReason').options,
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
            options: this.getFieldOptions('followUpTeamId').options,
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
            options: this.getFieldOptions('followUp[status]').options,
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

        // #TODO: Vaccine form-inputs shold be disabled like in the old design? Option currently not supported
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
   * Initialize tab - Questionnaire
   */
  private initializeTabQuestionnaire(): ICreateViewModifyV2Tab {
    // merge all records questionnaires
    this.determineQuestionnaireAnswers();

    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TAB_QUESTIONNAIRE_TITLE',
      sections: [
        // Questionnaire
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'questionnaireAnswers',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
              options: this.questionnaireAnswers.options,
              value: {
                get: (): string => this.questionnaireAnswers.options[0]?.label,
                set: (value: any) => {
                  this.itemData.questionnaireAnswers = value;
                }
              },
              validators: {
                required: () => true
              }
            }
            // #TODO: Needed to display answer selected but not accepted by .SECTION, should be also disabled.
            // Would be better to extend .TAB_TABLE_FILL_QUESTIONNAIRE and use it here?
            //  Show selected Questionnaire
            // {
            //   type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
            //   name: 'questionnaireAnswers',
            //   questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
            //   value: {
            //     get: () => this.itemData.questionnaireAnswers,
            //     set: (value) => {
            //       this.itemData.questionnaireAnswers = value;
            //     }
            //   }
            // }
          ]
        }
      ],
      visible: () => this.selectedOutbreak.contactInvestigationTemplate?.length > 0
    };
  }

  /**
     * Determine documents
     */
  private determineDocuments() {
    // merge all documents
    this.itemData.documents = [];
    _.each(this.mergeRecords, (ent: EntityModel) => {
      _.each((ent.model as ContactModel).documents, (doc: DocumentModel) => {
        if (doc.number || doc.type) {
          this.itemData.documents.push(doc);
        }
      });
    });
  }

  // #TODO: Couldn't implement the old logic
  // Why?
  // - can't hide form-inputs, tried with "replace()" but is not present on all type of form-inputs (.ADDRESS)
  // - can't change data and show changes to user when selecting currentAddress
  // Implemneted:
  // - this.determineAddresses() keeps the most recent currentAddress by date as before
  // - if currentAddress has no date becomes first one is keept others become previousAddress now
  // Pros:
  // - user gets more flexibility to edit/remove which addresses he likes
  // - now addressess WITHOUT date are keeped as previousAddresses
  // - before if address had just locationId and typeId currentAddress drop-down showed empty options, no more the case now
  // Cons:
  // - user can't figure out if addresses WITHOUT date where currentAddress before except the first one found which is keept
  // - idk if meets client requirements..
  /**
     * Determine addresses
     */
  private determineAddresses() {
    // merge all addresses, keep just one current address
    let currentAddress: AddressModel;
    this.itemData.addresses = [];
    _.each(this.mergeRecords, (ent: EntityModel) => {
      _.each((ent.model as ContactModel).addresses, (address: AddressModel) => {
        if (
          address.locationId ||
          address.fullAddress
        ) {
          // current address ?
          // if we have multiple current addresses then we need to change them to previously addresses
          if (address.typeId === AddressType.CURRENT_ADDRESS) {
            if (address.date) {
              // we have multiple current addresses ?
              if (currentAddress) {
                // address is newer?
                if (moment(currentAddress.date).isBefore(moment(address.date))) {
                  currentAddress.typeId = AddressType.PREVIOUS_ADDRESS;
                  this.itemData.addresses.push(currentAddress);
                  currentAddress = address;
                } else {
                  address.typeId = AddressType.PREVIOUS_ADDRESS;
                  this.itemData.addresses.push(address);
                }
              } else {
                currentAddress = address;
              }
            } else {
              if (currentAddress) {
                // make it previous address
                address.typeId = AddressType.PREVIOUS_ADDRESS;
                this.itemData.addresses.push(address);
              } else {
                currentAddress = address;
              }
            }
          } else {
            this.itemData.addresses.push(address);
          }
        }
      });
    });

    // do we have a recent current address ?
    if (currentAddress) {
      // put it first
      this.itemData.addresses.unshift(currentAddress);
    }
  }

  /**
     * Determine vaccines
     */
  private determineVaccines() {
    // merge all vaccines
    this.itemData.vaccinesReceived = [];
    _.each(this.mergeRecords, (ent: EntityModel) => {
      _.each((ent.model as ContactModel).vaccinesReceived, (vac: VaccineModel) => {
        if (vac.vaccine) {
          this.itemData.vaccinesReceived.push(vac);
        }
      });
    });
  }

  /**
     * Determine questionnaire answers
     */
  private determineQuestionnaireAnswers() {
    // add questionnaire answers
    _.each(this.mergeRecords, (ent: EntityModel) => {
      const model: ContactModel = ent.model as ContactModel;
      if (!_.isEmpty(model.questionnaireAnswers)) {
        this.questionnaireAnswers.options.push(new LabelValuePair(
          model.name,
          model.questionnaireAnswers
        ));
      }
    });

    // preselect questionnaire answer if we have only one
    if (this.questionnaireAnswers.options.length === 1) {
      this.itemData.questionnaireAnswers.value = this.questionnaireAnswers.options[0].value;
    }
  }

  // get field unique options
  private getFieldOptions(key: string): { options: LabelValuePair[], value: any } {
    switch (key) {
      case 'age': return EntityModel.uniqueAgeOptions(
        this.mergeRecords,
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      );
      case 'dob': return EntityModel.uniqueDobOptions(this.mergeRecords);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(this.mergeRecords, key);
        uniqueUserOptions.options = uniqueUserOptions.options.map(
          (labelValuePair) => {
            labelValuePair.label = this.activatedRoute.snapshot.data.users.options.find(
              (user) => user.value === labelValuePair.value).label;

            return new LabelValuePair(labelValuePair.label, labelValuePair.value);
          });
        return uniqueUserOptions;
      }
      case 'followUpTeamId': {
        const uniqueTeamIds = EntityModel.uniqueStringOptions(this.mergeRecords, key);
        uniqueTeamIds.options = uniqueTeamIds.options.map((pair: LabelValuePair) => {
          pair.label = this.activatedRoute.snapshot.data.teams.map[pair.label].name;
          return pair;
        });
        return uniqueTeamIds;
      }

      default: return EntityModel.uniqueStringOptions(this.mergeRecords, key);
    }
  }

  /**
  * Initialize buttons
  */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modify: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      createCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      viewCancel: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modifyCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      quickActions: {
        options: []
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      data,
      finished
    ) => {
      // Attach data if itemsChanged() not triggered
      if (data.documents === undefined) {
        data.documents = this.itemData.documents;
      }
      if (data.addresses === undefined) {
        data.addresses = this.itemData.addresses;
      }
      if (data.questionnaireAnswers === undefined) {
        data.questionnaireAnswers = this.itemData.questionnaireAnswers;
      }

      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.CONTACT,
          this.mergeRecordIds,
          data
        )
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((item) => {
          // success creating / updating event
          this.toastV2Service.success(
            'LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_MERGE_CONTACTS_SUCCESS_MESSAGE'
          );

          // finished with success
          finished(undefined, item);
        });
    };
  }
}
