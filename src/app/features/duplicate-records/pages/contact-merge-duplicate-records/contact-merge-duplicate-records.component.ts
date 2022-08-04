import * as _ from 'lodash';
import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { Observable, throwError } from 'rxjs';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ICreateViewModifyV2Refresh } from '../../../../shared/components-v2/app-create-view-modify-v2/models/refresh.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { TranslateService } from '@ngx-translate/core';
import { UserModel } from '../../../../core/models/user.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { EntityType } from '../../../../core/models/entity-type';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-contact-merge-duplicate-records',
  templateUrl: './contact-merge-duplicate-records.component.html'
})
export class ContactMergeDuplicateRecordsComponent extends CreateViewModifyComponent<ContactModel> implements OnDestroy {
  // data
  private _mergeRecordIds: string[];
  private _uniqueOptions: {
    firstName: ILabelValuePairModel[],
    middleName: ILabelValuePairModel[],
    lastName: ILabelValuePairModel[],
    gender: ILabelValuePairModel[],
    pregnancyStatus: ILabelValuePairModel[],
    occupation: ILabelValuePairModel[],
    age: ILabelValuePairModel[],
    dob: ILabelValuePairModel[],
    visualId: ILabelValuePairModel[],
    responsibleUserId: ILabelValuePairModel[],
    dateOfReporting: ILabelValuePairModel[],
    isDateOfReportingApproximate: ILabelValuePairModel[],
    riskLevel: ILabelValuePairModel[],
    riskReason: ILabelValuePairModel[],
    followUpTeamId: ILabelValuePairModel[],
    followUpStatus: ILabelValuePairModel[],
    questionnaireAnswers: ILabelValuePairModel[],
    questionnaireHistoryAnswers: ILabelValuePairModel[]
  };
  private _selectedQuestionnaireAnswers: number;
  private _selectedQuestionnaireHistoryAnswers: number;

  /**
   * Constructor
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    protected toastV2Service: ToastV2Service,
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
    this._mergeRecordIds = JSON.parse(this.activatedRoute.snapshot.queryParams.ids);
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
  protected retrieveItem(): Observable<ContactModel> {
    return new Observable<ContactModel>((subscriber) => {
      // retrieve records
      const qb = new RequestQueryBuilder();
      qb.filter.bySelect(
        'id',
        this._mergeRecordIds,
        true,
        null
      );

      // records
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((mergeRecords: EntityModel[]) => {
          // determine data
          this._uniqueOptions = {
            firstName: this.getFieldOptions(
              mergeRecords,
              'firstName'
            ).options,
            middleName: this.getFieldOptions(
              mergeRecords,
              'middleName'
            ).options,
            lastName: this.getFieldOptions(
              mergeRecords,
              'lastName'
            ).options,
            gender: this.getFieldOptions(
              mergeRecords,
              'gender'
            ).options,
            pregnancyStatus: this.getFieldOptions(
              mergeRecords,
              'pregnancyStatus'
            ).options,
            occupation: this.getFieldOptions(
              mergeRecords,
              'occupation'
            ).options,
            age: this.getFieldOptions(
              mergeRecords,
              'age'
            ).options,
            dob: this.getFieldOptions(
              mergeRecords,
              'dob'
            ).options,
            visualId: this.getFieldOptions(
              mergeRecords,
              'visualId'
            ).options,
            responsibleUserId: this.getFieldOptions(
              mergeRecords,
              'responsibleUserId'
            ).options,
            dateOfReporting: this.getFieldOptions(
              mergeRecords,
              'dateOfReporting'
            ).options,
            isDateOfReportingApproximate: this.getFieldOptions(
              mergeRecords,
              'isDateOfReportingApproximate'
            ).options,
            riskLevel: this.getFieldOptions(
              mergeRecords,
              'riskLevel'
            ).options,
            riskReason: this.getFieldOptions(
              mergeRecords,
              'riskReason'
            ).options,
            followUpTeamId: this.getFieldOptions(
              mergeRecords,
              'followUpTeamId'
            ).options,
            followUpStatus: this.getFieldOptions(
              mergeRecords,
              'followUp[status]'
            ).options,
            questionnaireAnswers: mergeRecords
              .filter((item) => (item.model as ContactModel).questionnaireAnswers && Object.keys((item.model as ContactModel).questionnaireAnswers).length > 0)
              .map((item, index) => ({
                label: `${ this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE') } ${ index + 1 }`,
                value: index,
                data: (item.model as ContactModel).questionnaireAnswers
              })),
            questionnaireHistoryAnswers: mergeRecords
              .filter((item) => (item.model as ContactModel).questionnaireAnswersCase && Object.keys((item.model as ContactModel).questionnaireAnswersCase).length > 0)
              .map((item, index) => ({
                label: `${ this.translateService.instant(EntityType.CONTACT) } ${ this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE') } ${ index + 1 }`,
                value: index,
                data: (item.model as ContactModel).questionnaireAnswersCase
              }))
          };

          // auto-select if only one value
          const data: ContactModel = new ContactModel();
          data.firstName = this._uniqueOptions.firstName.length === 1 ?
            this._uniqueOptions.firstName[0].value :
            data.firstName;
          data.middleName = this._uniqueOptions.middleName.length === 1 ?
            this._uniqueOptions.middleName[0].value :
            data.middleName;
          data.lastName = this._uniqueOptions.lastName.length === 1 ?
            this._uniqueOptions.lastName[0].value :
            data.lastName;
          data.gender = this._uniqueOptions.gender.length === 1 ?
            this._uniqueOptions.gender[0].value :
            data.gender;
          data.pregnancyStatus = this._uniqueOptions.pregnancyStatus.length === 1 ?
            this._uniqueOptions.pregnancyStatus[0].value :
            data.pregnancyStatus;
          data.occupation = this._uniqueOptions.occupation.length === 1 ?
            this._uniqueOptions.occupation[0].value :
            data.occupation;
          data.age = this._uniqueOptions.age.length === 1 ?
            this._uniqueOptions.age[0].value :
            data.age;
          data.dob = this._uniqueOptions.dob.length === 1 ?
            this._uniqueOptions.dob[0].value :
            data.dob;
          data.visualId = this._uniqueOptions.visualId.length === 1 ?
            this._uniqueOptions.visualId[0].value :
            data.visualId;
          data.responsibleUserId = this._uniqueOptions.responsibleUserId.length === 1 ?
            this._uniqueOptions.responsibleUserId[0].value :
            data.responsibleUserId;
          data.dateOfReporting = this._uniqueOptions.dateOfReporting.length === 1 ?
            this._uniqueOptions.dateOfReporting[0].value :
            data.dateOfReporting;
          data.isDateOfReportingApproximate = this._uniqueOptions.isDateOfReportingApproximate.length === 1 ?
            this._uniqueOptions.isDateOfReportingApproximate[0].value :
            data.isDateOfReportingApproximate;
          data.riskLevel = this._uniqueOptions.riskLevel.length === 1 ?
            this._uniqueOptions.riskLevel[0].value :
            data.riskLevel;
          data.riskReason = this._uniqueOptions.riskReason.length === 1 ?
            this._uniqueOptions.riskReason[0].value :
            data.riskReason;
          data.followUpTeamId = this._uniqueOptions.followUpTeamId.length === 1 ?
            this._uniqueOptions.followUpTeamId[0].value :
            data.followUpTeamId;
          data.followUp.status = this._uniqueOptions.followUpStatus.length === 1 ?
            this._uniqueOptions.followUpStatus[0].value :
            data.followUp.status;
          data.lastName = this._uniqueOptions.lastName.length === 1 ?
            this._uniqueOptions.lastName[0].value :
            data.lastName;
          data.lastName = this._uniqueOptions.lastName.length === 1 ?
            this._uniqueOptions.lastName[0].value :
            data.lastName;

          // select questionnaire answers
          this._selectedQuestionnaireAnswers = this._uniqueOptions.questionnaireAnswers.length === 1 ?
            this._uniqueOptions.questionnaireAnswers[0].value :
            this._selectedQuestionnaireAnswers;
          if (
            this._selectedQuestionnaireAnswers ||
            this._selectedQuestionnaireAnswers === 0
          ) {
            data.questionnaireAnswers = this._uniqueOptions.questionnaireAnswers[this._selectedQuestionnaireAnswers].data;
          }

          // select questionnaire history answers
          this._selectedQuestionnaireHistoryAnswers = this._uniqueOptions.questionnaireHistoryAnswers.length === 1 ?
            this._uniqueOptions.questionnaireHistoryAnswers[0].value :
            this._selectedQuestionnaireHistoryAnswers;
          if (
            this._selectedQuestionnaireHistoryAnswers ||
            this._selectedQuestionnaireHistoryAnswers === 0
          ) {
            data.questionnaireAnswersCase = this._uniqueOptions.questionnaireHistoryAnswers[this._selectedQuestionnaireHistoryAnswers].data;
          }

          // initialize documents, addresses ...
          const addedDocs: {
            [key: string]: true
          } = {};
          data.documents = [];
          let currentAddress: AddressModel;
          data.addresses = [];
          data.vaccinesReceived = [];

          // go through records and determine data
          mergeRecords.forEach((item) => {
            // determine documents
            ((item.model as ContactModel).documents || []).forEach((doc) => {
              // determine doc key
              const key: string = `${ doc.type ? doc.type.trim() : '' }${ doc.number ? doc.number.trim() : '' }`;

              // add to list ?
              if (
                key &&
                !addedDocs[key]
              ) {
                // add to list
                data.documents.push(doc);

                // make sure we don't add it again
                addedDocs[key] = true;
              }
            });

            // determine addresses
            ((item.model as ContactModel).addresses || []).forEach((address) => {
              // add to list ?
              if (
                address.locationId ||
                address.fullAddress
              ) {
                // current address ?
                // if we have multiple current addresses then we change them to previously addresses and keep the freshest one by address.date
                if (address.typeId === AddressType.CURRENT_ADDRESS) {
                  if (address.date) {
                    // we have multiple current addresses ?
                    if (currentAddress) {
                      // address is newer?
                      if (
                        !currentAddress.date ||
                        moment(currentAddress.date).isBefore(moment(address.date))
                      ) {
                        currentAddress.typeId = AddressType.PREVIOUS_ADDRESS;
                        data.addresses.push(currentAddress);
                        currentAddress = address;
                      } else {
                        address.typeId = AddressType.PREVIOUS_ADDRESS;
                        data.addresses.push(address);
                      }
                    } else {
                      currentAddress = address;
                    }
                  } else {
                    if (currentAddress) {
                      // make it previous address
                      address.typeId = AddressType.PREVIOUS_ADDRESS;
                      data.addresses.push(address);
                    } else {
                      currentAddress = address;
                    }
                  }
                } else {
                  data.addresses.push(address);
                }
              }
            });

            // determine vaccines
            ((item.model as ContactModel).vaccinesReceived || []).forEach((vaccine) => {
              if (vaccine.vaccine) {
                // add to list
                data.vaccinesReceived.push(vaccine);
              }
            });
          });

          // do we have a recent current address ?
          if (currentAddress) {
            // put it first
            data.addresses.unshift(currentAddress);
          }

          // finish
          subscriber.next(data);
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
        this.initializeTabQuestionnaire(),
        this.initializeTabQuestionnaireAsCase()
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
              options: this._uniqueOptions.firstName,
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
              options: this._uniqueOptions.middleName,
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
              options: this._uniqueOptions.lastName,
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
              options: this._uniqueOptions.gender,
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
              options: this._uniqueOptions.pregnancyStatus,
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
              options: this._uniqueOptions.occupation,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
                }
              }
            },
            {
              // #TODO: Drop-down doesn't display selection correct.
              // Steps:
              // - select a value
              // - select another value
              // - previous selected value remains displayed
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'age',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_AGE',
              description: () => 'LNG_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
              options: this._uniqueOptions.age,
              value: {
                get: () => this.itemData.age as any,
                set: (value: any) => {
                  this.itemData.age = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'dob',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_DOB',
              description: () => 'LNG_CONTACT_FIELD_LABEL_DOB_DESCRIPTION',
              options: this._uniqueOptions.dob,
              value: {
                get: () => this.itemData.dob,
                set: (value) => {
                  this.itemData.dob = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this.selectedOutbreak.contactIdMask
              ),
              options: this._uniqueOptions.visualId,
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
              options: this._uniqueOptions.responsibleUserId,
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
            readonly: true,
            items: this.itemData.documents,
            itemsChanged: (list) => {
              // update documents
              this.itemData.documents = list.items;
            },
            definition: {
              add: undefined,
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
            readonly: true,
            items: this.itemData.addresses,
            itemsChanged: (list) => {
              // update addresses
              this.itemData.addresses = list.items;
            },
            definition: {
              add: undefined,
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
            options: this._uniqueOptions.dateOfReporting,
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
            options: this._uniqueOptions.isDateOfReportingApproximate,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate as any,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value as any;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: this._uniqueOptions.riskLevel,
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
            options: this._uniqueOptions.riskReason,
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
            options: this._uniqueOptions.followUpTeamId,
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
            options: this._uniqueOptions.followUpStatus,
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

        // Questionnaires
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_TAB_QUESTIONNAIRE_TITLE',
          inputs: [
            // answers
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: '_selectedQuestionnaireAnswers',
              placeholder: () => 'LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
              options: this._uniqueOptions.questionnaireAnswers,
              value: {
                get: () => this._selectedQuestionnaireAnswers as any,
                set: (value) => {
                  // set data
                  this._selectedQuestionnaireAnswers = value as any;

                  // hack to force re-render without throwing errors because some bindings are missing
                  this.itemData.questionnaireAnswers = {};
                  setTimeout(() => {
                    this.itemData.questionnaireAnswers = this._selectedQuestionnaireAnswers || this._selectedQuestionnaireAnswers === 0 ?
                      this._uniqueOptions.questionnaireAnswers[this._selectedQuestionnaireAnswers].data :
                      null;
                  });
                }
              }
            },

            // history answers
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: '_selectedQuestionnaireHistoryAnswers',
              placeholder: () => `${ this.translateService.instant(EntityType.CONTACT) } ${ this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE') }`,
              options: this._uniqueOptions.questionnaireHistoryAnswers,
              value: {
                get: () => this._selectedQuestionnaireHistoryAnswers as any,
                set: (value) => {
                  // set data
                  this._selectedQuestionnaireHistoryAnswers = value as any;

                  // hack to force re-render without throwing errors because some bindings are missing
                  this.itemData.questionnaireAnswersCase = {};
                  setTimeout(() => {
                    this.itemData.questionnaireAnswersCase = this._selectedQuestionnaireHistoryAnswers || this._selectedQuestionnaireHistoryAnswers === 0 ?
                      this._uniqueOptions.questionnaireHistoryAnswers[this._selectedQuestionnaireHistoryAnswers].data :
                      null;
                  });
                }
              }
            }
          ]
        },

        // Vaccines
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'vaccinesReceived',
            readonly: true,
            items: this.itemData.vaccinesReceived,
            itemsChanged: (list) => {
              // update documents
              this.itemData.vaccinesReceived = list.items;
            },
            definition: {
              add: undefined,
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
  private initializeTabQuestionnaire(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_PAGE_MODIFY_CONTACT_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.contactInvestigationTemplate,
        disableValidation: true,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: undefined
        },
        updateErrors: () => {}
      },
      invalidHTMLSuffix: () => '',
      visible: () => this.selectedOutbreak.contactInvestigationTemplate?.length > 0 &&
        this.itemData.questionnaireAnswers &&
        Object.keys(this.itemData.questionnaireAnswers).length > 0
    };
  }

  /**
   * Initialize tab - Questionnaire
   */
  private initializeTabQuestionnaireAsCase(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: `${ this.translateService.instant(EntityType.CASE) } ${ this.translateService.instant('LNG_PAGE_MODIFY_CONTACT_TAB_CASE_QUESTIONNAIRE_TITLE') }`,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswersCase',
        questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
        disableValidation: true,
        value: {
          get: () => this.itemData.questionnaireAnswersCase,
          set: undefined
        },
        updateErrors: () => {}
      },
      invalidHTMLSuffix: () => '',
      visible: () => this.selectedOutbreak.caseInvestigationTemplate?.length > 0 &&
        this.itemData.questionnaireAnswersCase &&
        Object.keys(this.itemData.questionnaireAnswersCase).length > 0
    };
  }

  /**
    * Get field unique options
    */
  private getFieldOptions(
    mergeRecords: EntityModel[],
    key: string
  ): { options: ILabelValuePairModel[], value: any } {
    switch (key) {
      case 'age': return EntityModel.uniqueAgeOptions(
        mergeRecords,
        this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      );
      case 'dob': return EntityModel.uniqueDobOptions(mergeRecords);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(mergeRecords, key);
        uniqueUserOptions.options.forEach(
          (labelValuePair) => {
            labelValuePair.label = (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value] ?
              (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value].name :
              labelValuePair.label;
          });
        return uniqueUserOptions;
      }
      case 'followUpTeamId': {
        const uniqueTeamIds = EntityModel.uniqueStringOptions(mergeRecords, key);
        uniqueTeamIds.options = uniqueTeamIds.options.map((pair: ILabelValuePairModel) => {
          pair.label = this.activatedRoute.snapshot.data.teams.map[pair.label].name;
          return pair;
        });
        return uniqueTeamIds;
      }

      default: return EntityModel.uniqueStringOptions(mergeRecords, key);
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
      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.CONTACT,
          this._mergeRecordIds,
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
