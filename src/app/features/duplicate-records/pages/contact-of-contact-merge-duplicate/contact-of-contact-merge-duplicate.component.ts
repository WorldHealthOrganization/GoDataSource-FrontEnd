import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError, takeUntil } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ICreateViewModifyV2Refresh } from '../../../../shared/components-v2/app-create-view-modify-v2/models/refresh.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { UserModel } from '../../../../core/models/user.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-contact-of-contact-merge-duplicate',
  templateUrl: './contact-of-contact-merge-duplicate.component.html'
})
export class ContactOfContactMergeDuplicateComponent extends CreateViewModifyComponent<ContactOfContactModel> implements OnDestroy {
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
    riskReason: ILabelValuePairModel[]
  };
  private _ageContactOfContactID: string;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    protected toastV2Service: ToastV2Service,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected i18nService: I18nService,
    private outbreakDataService: OutbreakDataService
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
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
  protected createNewItem(): ContactOfContactModel {
    return null;
  }

  /**
    * Retrieve item
    */
  protected retrieveItem(_record?: ContactOfContactModel): Observable<ContactOfContactModel> {
    return new Observable<ContactOfContactModel>((subscriber) => {
      // retrieve records
      const qb = new RequestQueryBuilder();
      qb.filter.bySelect(
        'id',
        this._mergeRecordIds,
        true,
        null
      );

      // retrieve
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((mergeRecords) => {
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
            ).options
          };

          // auto-select if only one value
          const data: ContactOfContactModel = new ContactOfContactModel();
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
          this._ageContactOfContactID = this._uniqueOptions.age.length === 1 ?
            this._uniqueOptions.age[0].value :
            undefined;
          data.age = this._ageContactOfContactID !== undefined ?
            this._uniqueOptions.age.find((ageItem) => ageItem.value === this._ageContactOfContactID).data :
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
            ((item.model as ContactOfContactModel).documents || []).forEach((doc) => {
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
            ((item.model as ContactOfContactModel).addresses || []).forEach((address) => {
              // create a full address with all fields (filter is used to remove empty strings or undefined values)
              const addressFields = [
                address.fullAddress,
                address.locationId,
                address.postalCode,
                address.emailAddress,
                address.phoneNumber,
                address.geoLocation?.lat,
                address.geoLocation?.lng
              ].map((e) => e ? e.toString().trim() : e)
                .filter((e) => e);

              // add to list ?
              if (addressFields.length) {
                // current address ?
                // if we have multiple current addresses then we change them to previously addresses and keep the freshest one by address.date
                if (address.typeId === AddressType.CURRENT_ADDRESS) {
                  if (address.date) {
                    // we have multiple current addresses ?
                    if (currentAddress) {
                      // address is newer?
                      if (
                        !currentAddress.date ||
                        LocalizationHelper.toMoment(currentAddress.date).isBefore(LocalizationHelper.toMoment(address.date))
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
            ((item.model as ContactOfContactModel).vaccinesReceived || []).forEach((vaccine) => {
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
    this.pageTitle = 'LNG_PAGE_CONTACT_OF_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE';
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
        label: 'LNG_PAGE_CONTACT_OF_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
      * Initialize tabs
      */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal(),

        // // Epidemiology
        this.initializeTabsEpidemiology()
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
      quickActions: undefined
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
      // age
      if (data.age) {
        data.age = this.itemData.age;
      }

      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.CONTACT_OF_CONTACT,
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
          this.toastV2Service.success('LNG_PAGE_CONTACT_OF_CONTACT_MERGE_DUPLICATE_RECORDS_MERGE_CONTACTS_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, item);
        });
    };
  }

  /**
  * Initialize tabs - Personal
  */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'personal',
      label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'firstName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              options: this._uniqueOptions.firstName,
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  this.itemData.firstName = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'middleName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              options: this._uniqueOptions.middleName,
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  this.itemData.middleName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'lastName',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              options: this._uniqueOptions.lastName,
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  this.itemData.lastName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
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
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
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
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'occupation',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
              options: this._uniqueOptions.occupation,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'age',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_DESCRIPTION',
              options: this._uniqueOptions.age,
              value: {
                get: () => this._ageContactOfContactID,
                set: (value: any) => {
                  this._ageContactOfContactID = value ?
                    value :
                    undefined;
                  this.itemData.age = this._ageContactOfContactID !== undefined ?
                    this._uniqueOptions.age.find((ageItem) => ageItem.value === this._ageContactOfContactID).data :
                    undefined;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'dob',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB_DESCRIPTION',
              options: this._uniqueOptions.dob,
              value: {
                get: () => this.itemData.dob as any,
                set: (value) => {
                  this.itemData.dob = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'visualId',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
              description: () => this.i18nService.instant(
                'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this.selectedOutbreak.contactOfContactIdMask
              ),
              options: this._uniqueOptions.visualId,
              value: {
                get: () => this.itemData.visualId,
                set: (value) => {
                  this.itemData.visualId = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: this._uniqueOptions.responsibleUserId,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this.authUser),
                html: this.i18nService.instant('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_CANT_SET_RESPONSIBLE_ID_TITLE')
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
            },
            visibleMandatoryChild: {
              visible: () => true,
              mandatory: () => false
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
                },
                validators: {
                  required: () => true
                }
              }
            },
            visibleMandatoryChild: {
              visible: () => true,
              mandatory: () => false
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
      name: 'infection',
      label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            options: this._uniqueOptions.dateOfReporting,
            value: {
              get: () => this.itemData.dateOfReporting as any,
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
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
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
            placeholder: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            options: this._uniqueOptions.riskReason,
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
            },
            visibleMandatoryChild: {
              visible: () => true,
              mandatory: () => false
            }
          }]
        }
      ]
    };
  }

  // get field unique options
  private getFieldOptions(
    mergeRecords: EntityModel[],
    key: string
  ): { options: ILabelValuePairModel[], value: any } {
    switch (key) {
      case 'age': return EntityModel.uniqueAgeOptions(
        mergeRecords,
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
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
      default: return EntityModel.uniqueStringOptions(mergeRecords, key);
    }
  }
}
