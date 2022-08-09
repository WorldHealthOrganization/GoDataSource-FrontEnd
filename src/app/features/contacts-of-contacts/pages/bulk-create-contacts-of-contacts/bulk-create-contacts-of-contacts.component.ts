import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, share } from 'rxjs/operators';
import * as _ from 'lodash';
import { Observable, of, Subscription, throwError } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { UserModel } from '../../../../core/models/user.model';
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import * as Handsontable from 'handsontable';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { CellProperties } from 'handsontable/settings';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';

@Component({
  selector: 'app-bulk-create-contacts-of-contacts',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bulk-create-contacts-of-contacts.component.html',
  styleUrls: ['./bulk-create-contacts-of-contacts.component.scss']
})
export class BulkCreateContactsOfContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  relatedEntityId: string;

  // contact options
  genderList$: Observable<ILabelValuePairModel[]>;
  occupationsList$: Observable<ILabelValuePairModel[]>;
  riskLevelsList$: Observable<ILabelValuePairModel[]>;
  documentTypesList$: Observable<ILabelValuePairModel[]>;

  // relationship options
  certaintyLevelOptions$: Observable<ILabelValuePairModel[]>;
  exposureTypeOptions$: Observable<ILabelValuePairModel[]>;
  exposureFrequencyOptions$: Observable<ILabelValuePairModel[]>;
  exposureDurationOptions$: Observable<ILabelValuePairModel[]>;
  socialRelationshipOptions$: Observable<ILabelValuePairModel[]>;

  relatedEntityData: ContactModel;

  // sheet widget configuration
  sheetContextMenu = {};
  sheetColumns: any[] = [];

  // error messages
  errorMessages: {
    message: string,
    data?: {
      row: number,
      columns?: string,
      err?: string
    }
  }[] = [];

  contactOfContactVisualIdModel: {
    mask: string
  };

  // action
  actionButton: IV2ActionIconLabel;

  // subscribers
  outbreakSubscriber: Subscription;

  // authenticated user details
  authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private contactDataService: ContactDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService
  ) {
    super();
  }

  /**
   * Component initialized
   */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // reference data
    this.genderList$ = of((this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.occupationsList$ = of((this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.riskLevelsList$ = of((this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.documentTypesList$ = of((this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.certaintyLevelOptions$ = of((this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureTypeOptions$ = of((this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureFrequencyOptions$ = of((this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureDurationOptions$ = of((this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.socialRelationshipOptions$ = of((this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());

    // configure Sheet widget
    this.configureSheetWidget();

    // retrieve query params
    this.activatedRoute.queryParams
      .subscribe((params: { entityId }) => {
        this.relatedEntityId = _.get(params, 'entityId');

        if (!this.validateRelatedEntity()) {
          return;
        }

        // initialize page breadcrumbs
        this.initializeBreadcrumbs();

        // retrieve related person information
        this.retrieveRelatedPerson();
      });

    // get selected outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreak()
      .pipe(
        catchError((err) => {
          // show error message
          this.toastV2Service.error(err);

          // navigate to Contacts listing page
          this.redirectToContactListPage();
          return throwError(err);
        })
      )
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
        // setting the contact visual id model
        this.contactOfContactVisualIdModel = {
          mask : ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
        };

        this.retrieveRelatedPerson();
      });

    // action button
    this.actionButton = {
      type: V2ActionType.ICON_LABEL,
      icon: '',
      label: 'LNG_COMMON_BUTTON_SAVE',
      action: {
        click: () => {
          this.addContactsOfContacts();
        }
      }
    };
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // contact list
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // contacts list page
    if (ContactOfContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // current page breadcrumb
    this.breadcrumbs.push({
      label: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Configure 'Handsontable'
   */
  private configureSheetWidget() {
    // configure columns
    this.sheetColumns = [
      // Contact of Contact properties
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME')
        .setProperty('contactOfContact.firstName')
        .setRequired(),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME')
        .setProperty('contactOfContact.lastName'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID')
        .setProperty('contactOfContact.visualId')
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (_.isEmpty(value)) {
            callback(true);
          } else {
            const visualIDTranslateData = {
              mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
            };
            // set visual ID validator
            this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
              this.selectedOutbreak.id,
              visualIDTranslateData.mask,
              value
            )
              .pipe(
                catchError((err) => {
                  callback(false);
                  return throwError(err);
                })
              )
              .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                if (isValid === true) {
                  callback(true);
                } else {
                  callback(false);
                }
              });
          }
        }),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER')
        .setProperty('contactOfContact.gender')
        .setOptions(this.genderList$, this.i18nService),
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
        .setProperty('contactOfContact.dateOfReporting')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION')
        .setProperty('contactOfContact.occupation')
        .setOptions(this.occupationsList$, this.i18nService),
      new IntegerSheetColumn(
        0,
        Constants.DEFAULT_AGE_MAX_YEARS)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_YEARS')
        .setProperty('contactOfContact.age.years'),
      new IntegerSheetColumn(
        0,
        11)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_MONTHS')
        .setProperty('contactOfContact.age.months'),
      new DateSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
        .setProperty('contactOfContact.dob'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL')
        .setProperty('contactOfContact.riskLevel')
        .setOptions(this.riskLevelsList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON')
        .setProperty('contactOfContact.riskReason'),

      // Contact Address(es)
      new LocationSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
        .setProperty('contactOfContact.addresses[0].locationId')
        .setUseOutbreakLocations(true)
        .setLocationChangedCallback((rowNo, locationInfo) => {
          // nothing to do ?
          if (
            !locationInfo ||
            !locationInfo.geoLocation ||
            typeof locationInfo.geoLocation.lat !== 'number' ||
            typeof locationInfo.geoLocation.lng !== 'number'
          ) {
            return;
          }

          // ask for confirmation if we should copy location lat & lng
          this.dialogV2Service
            .showConfirmDialog({
              config: {
                title: {
                  get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                },
                message: {
                  get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
                }
              }
            })
            .subscribe((response) => {
              // canceled ?
              if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                // finished
                return;
              }

              // find lat column
              const latColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === 'contactOfContact.addresses[0].geoLocation.lat');
              const lngColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === 'contactOfContact.addresses[0].geoLocation.lng');

              // change location lat & lng
              const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
              sheetCore.setDataAtCell(
                rowNo,
                latColumnIndex,
                locationInfo.geoLocation.lat
              );
              sheetCore.setDataAtCell(
                rowNo,
                lngColumnIndex,
                locationInfo.geoLocation.lng
              );
            });
        }),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
        .setProperty('contactOfContact.addresses[0].city'),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
        .setProperty('contactOfContact.addresses[0].addressLine1'),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
        .setProperty('contactOfContact.addresses[0].postalCode'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER')
        .setProperty('contactOfContact.addresses[0].phoneNumber'),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT')
        .setProperty('contactOfContact.addresses[0].geoLocation.lat')
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (
            value ||
            value === 0
          ) {
            callback(true);
          } else {
            // for now lng should always be the next one
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
            const lat: number | string = sheetCore.getDataAtCell(cellProperties.row, cellProperties.col + 1);
            callback(!lat && lat !== 0);
          }
        }),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG')
        .setProperty('contactOfContact.addresses[0].geoLocation.lng')
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (
            value ||
            value === 0
          ) {
            callback(true);
          } else {
            // for now lat should always be the previous one
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
            const lat: number | string = sheetCore.getDataAtCell(cellProperties.row, cellProperties.col - 1);
            callback(!lat && lat !== 0);
          }
        }),

      // Contact Document(s)
      new DropdownSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
        .setProperty('contactOfContact.documents[0].type')
        .setOptions(this.documentTypesList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
        .setProperty('contactOfContact.documents[0].number'),

      // Relationship properties
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE')
        .setProperty('relationship.contactDate')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL')
        .setProperty('relationship.certaintyLevelId')
        .setOptions(this.certaintyLevelOptions$, this.i18nService)
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE')
        .setProperty('relationship.exposureTypeId')
        .setOptions(this.exposureTypeOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY')
        .setProperty('relationship.exposureFrequencyId')
        .setOptions(this.exposureFrequencyOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION')
        .setProperty('relationship.exposureDurationId')
        .setOptions(this.exposureDurationOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_RELATION')
        .setProperty('relationship.socialRelationshipTypeId')
        .setOptions(this.socialRelationshipOptions$, this.i18nService)
    ];

    // configure the context menu
    this.sheetContextMenu = {
      items: {
        row_above: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_ABOVE')
        },
        row_below: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_BELOW')
        },
        remove_row: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_REMOVE_ROW')
        },
        cut: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_CUT')
        },
        copy: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_COPY')
        }
      }
    };
  }

  /**
   * After changes
   */
  afterBecameDirty() {
    // no input to make dirty ?
    if (!this.inputForMakingFormDirty) {
      return;
    }

    // make form dirty
    this.inputForMakingFormDirty.control.markAsDirty();
  }

  /**
   * Retrieve information of related person
   */
  private retrieveRelatedPerson() {
    if (
      this.selectedOutbreak &&
      this.selectedOutbreak.id &&
      this.relatedEntityId
    ) {
      // retrieve related person information
      this.contactDataService
        .getContact(this.selectedOutbreak.id, this.relatedEntityId)
        .pipe(
          catchError((err) => {
            // show error message
            this.toastV2Service.error(err);

            // navigate to Cases/Events listing page
            this.redirectToContactListPage();

            return throwError(err);
          })
        )
        .subscribe((relatedEntityData: ContactModel) => {
          // keep person data
          this.relatedEntityData = relatedEntityData;
        });
    }
  }

  /**
   * Check that we have related Person Type and ID
   */
  private validateRelatedEntity() {
    if (this.relatedEntityId) {
      return true;
    }

    // related person data is wrong or missing
    this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_CONTACT_REQUIRED');

    // navigate to Contacts listing page
    this.redirectToContactListPage();

    return false;
  }

  /**
   * Redirect to Contacts list page
   */
  private redirectToContactListPage() {
    if (ContactModel.canList(this.authUser)) {
      this.router.navigate(['/contacts']);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Create multiple Contacts of Contacts
   */
  addContactsOfContacts() {
    // make sure we have the component used to validate & retrieve data
    if (!this.hotTableWrapper) {
      return;
    }

    // validate sheet
    const loadingDialog = this.dialogV2Service.showLoadingDialog();
    this.errorMessages = [];
    this.hotTableWrapper
      .validateTable()
      .subscribe((response) => {
        // we can't continue if we have errors
        if (!response.isValid) {
          // map error messages if any?
          this.errorMessages = this.hotTableWrapper.getErrors(
            response,
            'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_ERROR_MSG'
          );

          // show error
          loadingDialog.close();
          this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_INVALID_FIELDS');
        } else {
          // collect data from table
          this.hotTableWrapper
            .getData()
            .subscribe((dataResponse: {
              data: any[],
              sheetCore: Handsontable.default
            }) => {
              // no data to save ?
              if (_.isEmpty(dataResponse.data)) {
                // show error
                loadingDialog.close();
                this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_NO_DATA');
              } else {
                // create contacts of contacts
                this.contactsOfContactsDataService
                  .bulkAddContactsOfContacts(
                    this.selectedOutbreak.id,
                    this.relatedEntityId,
                    dataResponse.data
                  )
                  .pipe(
                    catchError((err) => {
                      // close dialog
                      loadingDialog.close();

                      // mark success records
                      this.errorMessages = [];
                      if (dataResponse.sheetCore) {
                        // display partial success message
                        if (!_.isEmpty(_.get(err, 'details.success'))) {
                          this.errorMessages.push({
                            message: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_PARTIAL_ERROR_MSG'
                          });
                        }

                        // remove success records
                        // items should be ordered by recordNo
                        //  - so in this case if we reverse we can remove records from sheet without having to take in account that we removed other rows as well
                        (_.get(err, 'details.success') || []).reverse().forEach((successRecord) => {
                          // remove record that was added
                          if (_.isNumber(successRecord.recordNo)) {
                            // remove row
                            dataResponse.sheetCore.alter(
                              'remove_row',
                              successRecord.recordNo,
                              1
                            );

                            // substract row numbers
                            _.each(
                              _.get(err, 'details.failed'),
                              (item) => {
                                if (!_.isNumber(item.recordNo)) {
                                  return;
                                }

                                // if record is after the one that we removed then we need to substract 1 value
                                if (item.recordNo > successRecord.recordNo) {
                                  item.recordNo = item.recordNo - 1;
                                }
                              }
                            );
                          }
                        });
                      }

                      // prepare errors to parse later into more readable errors
                      const errors = [];
                      (_.get(err, 'details.failed') || []).forEach((childError) => {
                        if (!_.isEmpty(childError.error)) {
                          errors.push({
                            err: childError.error,
                            echo: childError
                          });
                        }
                      });

                      // try to parse into more clear errors
                      this.toastV2Service.translateErrors(errors)
                        .subscribe((translatedErrors) => {
                          // transform errors
                          (translatedErrors || []).forEach((translatedError) => {
                            // determine row number
                            let row: number = _.get(translatedError, 'echo.recordNo', null);
                            if (_.isNumber(row)) {
                              row++;
                            }

                            // add to error list
                            this.errorMessages.push({
                              message: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_API_ERROR_MSG',
                              data: {
                                row: row,
                                err: translatedError.message
                              }
                            });
                          });
                        });

                      // display error
                      this.toastV2Service.error(err);
                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    loadingDialog.close();
                    if (ContactOfContactModel.canList(this.authUser)) {
                      this.router.navigate(['/contacts-of-contacts']);
                    } else {
                      this.router.navigate(['/']);
                    }
                  });
              }
            });
        }
      });
  }

}
