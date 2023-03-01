import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, of, throwError } from 'rxjs';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import * as Handsontable from 'handsontable';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, map, share } from 'rxjs/operators';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import {
  HotTableWrapperComponent,
  IHotTableWrapperEvent
} from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { CellProperties } from 'handsontable/settings';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { HotTableComponent } from '@handsontable/angular';
import { IAddressColumnIndex } from '../../../../core/models/address-column-index.interface';

@Component({
  selector: 'app-bulk-create-contacts',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bulk-create-contacts.component.html',
  styleUrls: ['./bulk-create-contacts.component.scss']
})
export class BulkCreateContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
  // constants
  private static readonly COLUMN_PROPERTY_PREGNANCY_STATUS: string = 'contact.pregnancyStatus';
  private static readonly COLUMN_PROPERTY_LAST_CONTACT: string = 'relationship.contactDate';
  private static readonly COLUMN_PROPERTY_DATE: string = 'contact.addresses[0].date';
  private static readonly COLUMN_PROPERTY_EMAIL_ADDRESS: string = 'contact.addresses[0].emailAddress';
  private static readonly COLUMN_PROPERTY_PHONE_NUMBER: string = 'contact.addresses[0].phoneNumber';
  private static readonly COLUMN_PROPERTY_LOCATION: string = 'contact.addresses[0].locationId';
  private static readonly COLUMN_PROPERTY_CITY: string = 'contact.addresses[0].city';
  private static readonly COLUMN_PROPERTY_POSTAL_CODE: string = 'contact.addresses[0].postalCode';
  private static readonly COLUMN_PROPERTY_ADDRESS_LINE1: string = 'contact.addresses[0].addressLine1';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LAT: string = 'contact.addresses[0].geoLocation.lat';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LNG: string = 'contact.addresses[0].geoLocation.lng';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_ACCURATE: string = 'contact.addresses[0].geoLocationAccurate';

  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  // related entity
  relatedEntityType: EntityType;
  relatedEntityId: string;

  // contact options
  genderList$: Observable<ILabelValuePairModel[]>;
  occupationsList$: Observable<ILabelValuePairModel[]>;
  riskLevelsList$: Observable<ILabelValuePairModel[]>;
  documentTypesList$: Observable<ILabelValuePairModel[]>;
  yesNoList$: Observable<ILabelValuePairModel[]>;
  pregnancyStatusList$: Observable<ILabelValuePairModel[]>;

  // relationship options
  certaintyLevelOptions$: Observable<ILabelValuePairModel[]>;
  exposureTypeOptions$: Observable<ILabelValuePairModel[]>;
  exposureFrequencyOptions$: Observable<ILabelValuePairModel[]>;
  exposureDurationOptions$: Observable<ILabelValuePairModel[]>;
  socialRelationshipOptions$: Observable<ILabelValuePairModel[]>;
  clusterList$: Observable<ILabelValuePairModel[]>;

  relatedEntityData: CaseModel | EventModel;

  // sheet widget configuration
  sheetContextMenu = {};
  sheetColumns: any[] = [];

  // sheet column indexes
  private _addressColumnIndexes: IAddressColumnIndex;
  private _addressColumnIndexesMap: {
    [columnIndex: number]: true
  } = {};
  private _pregnancyStatusColumnIndex: number;

  // manual cleared "date" cells
  private _manualClearedDateCells: {
    [rowNumber: number]: true
  } = {};

  // error messages
  errorMessages: {
    message: string,
    data?: {
      row: number,
      columns?: string,
      err?: string
    }
  }[] = [];

  // warning messages
  private _warnings: {
    dateOfOnset: string | null,
    rows: {
      [rowIndex: number]: true
    }
  } = {
      dateOfOnset: null,
      rows: {}
    };

  contactVisualIdModel: {
    mask: string
  };

  // action
  actionButton: IV2ActionIconLabel;

  // subscribers
  outbreakSubscriber: Subscription;

  // authenticated user details
  authUser: UserModel;

  // teams
  teamList$: Observable<TeamModel[]>;

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private contactDataService: ContactDataService,
    private entityDataService: EntityDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService,
    private teamDataService: TeamDataService
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
    this.yesNoList$ = of((this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.pregnancyStatusList$ = of((this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.clusterList$ = of((this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());

    // teams
    if (TeamModel.canList(this.authUser)) {
      this.teamList$ = this.teamDataService.getTeamsListReduced().pipe(share());
    }

    // configure Sheet widget
    this.configureSheetWidget();

    // retrieve query params
    this.activatedRoute.queryParams
      .subscribe((params: { entityType, entityId }) => {
        this.relatedEntityType = _.get(params, 'entityType');
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

          // navigate to Cases/Events listing page
          this.redirectToRelatedEntityList();
          return throwError(err);
        })
      )
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
        // setting the contact visual id model
        this.contactVisualIdModel = {
          mask : ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
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
          this.addContacts();
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

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
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

    // case or event?
    if (this.relatedEntityType === EntityType.CASE) {
      // case list
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        });
      }
    } else if (this.relatedEntityType === EntityType.EVENT) {
      // event list
      if (EventModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_EVENTS_TITLE',
          action: {
            link: ['/events']
          }
        });
      }
    } else {
      // NOT SUPPORTED :)
    }

    // contacts list page
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // current page breadcrumb
    this.breadcrumbs.push({
      label: 'LNG_PAGE_BULK_ADD_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Configure 'Handsontable'
   */
  private configureSheetWidget() {
    // configure columns
    this.sheetColumns = [
      // Contact properties
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_FIRST_NAME')
        .setProperty('contact.firstName')
        .setRequired(),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME')
        .setProperty('contact.middleName'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_LAST_NAME')
        .setProperty('contact.lastName'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_GENDER')
        .setProperty('contact.gender')
        .setOptions(this.genderList$, this.i18nService)
        .setAsyncValidator((value: string, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // if gender is male reset pregnancy status value and make the cell readonly
          if (value) {
            // find pregnancy status column
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;

            // check if it's "male"
            if (value === this.i18nService.instant(Constants.GENDER_MALE)) {
              // reset pregnancy status value
              sheetCore.setDataAtCell(
                cellProperties.row,
                this._pregnancyStatusColumnIndex,
                null
              );
            }

            // change pregnancy status cell state read only/editable
            sheetCore.setCellMeta(cellProperties.row, this._pregnancyStatusColumnIndex, 'readOnly', value === this.i18nService.instant(Constants.GENDER_MALE));
          }

          // return always true to pass the validation (since pregnancy value it was cleared or gender is not male)
          callback(true);
        }),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_PREGNANCY_STATUS)
        .setOptions(this.pregnancyStatusList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_OCCUPATION')
        .setProperty('contact.occupation')
        .setOptions(this.occupationsList$, this.i18nService),
      new IntegerSheetColumn(
        0,
        Constants.DEFAULT_AGE_MAX_YEARS)
        .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_YEARS')
        .setProperty('contact.age.years'),
      new IntegerSheetColumn(
        0,
        11)
        .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_MONTHS')
        .setProperty('contact.age.months'),
      new DateSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
        .setProperty('contact.dob'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_VISUAL_ID')
        .setProperty('contact.visualId')
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (_.isEmpty(value)) {
            callback(true);
          } else {
            const visualIDTranslateData = {
              mask: ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
            };
            // set visual ID validator
            this.contactDataService
              .checkContactVisualIDValidity(
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

      // Contact Document(s)
      new DropdownSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
        .setProperty('contact.documents[0].type')
        .setOptions(this.documentTypesList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
        .setProperty('contact.documents[0].number'),

      // Contact Address(es)
      new DateSheetColumn()
        .setTitle('LNG_PAGE_BULK_ADD_CONTACTS_ADDRESS_DATE')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_DATE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS)
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // validate if only we have value
          if (!value) {
            callback(true);
          } else {
            // validate email using regex
            callback(Constants.REGEX_EMAIL_VALIDATOR.test(value));
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      new LocationSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_LOCATION)
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

              // change location lat & lng
              const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
              sheetCore.setDataAtCell(
                rowNo,
                this._addressColumnIndexes.geoLocationLat,
                locationInfo.geoLocation.lat
              );
              sheetCore.setDataAtCell(
                rowNo,
                this._addressColumnIndexes.geoLocationLng,
                locationInfo.geoLocation.lng
              );
            });
        })
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // location is required if any of the address field is filled
          if (value) {
            callback(true);
          } else {
            // check address fields
            return callback(
              !this.isAddressFilled(
                cellProperties.row,
                this._addressColumnIndexes.locationId
              )
            );
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_CITY),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT)
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
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG)
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
      new DropdownSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
        .setOptions(this.yesNoList$, this.i18nService),

      // Epidemiology
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
        .setProperty('contact.dateOfReporting')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE')
        .setProperty('contact.isDateOfReportingApproximate')
        .setOptions(this.yesNoList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
        .setProperty('contact.riskLevel')
        .setOptions(this.riskLevelsList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
        .setProperty('contact.riskReason')
    ];

    // add assigned team if we have permissions to do that
    if (TeamModel.canList(this.authUser)) {
      this.sheetColumns.push(
        new DropdownSheetColumn()
          .setTitle('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID')
          .setProperty('contact.followUpTeamId')
          .setOptions(
            this.teamList$.pipe(
              map((teams: TeamModel[]) => {
                return teams.map((team) => {
                  return {
                    label: team.name,
                    value: team.id
                  };
                });
              }),
              share()
            ),
            this.i18nService,
            false
          )
      );
    }

    // Relationship properties
    this.sheetColumns.push(
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT')
        .setProperty('relationship.dateOfFirstContact'),
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE')
        .setProperty(BulkCreateContactsComponent.COLUMN_PROPERTY_LAST_CONTACT)
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED')
        .setProperty('relationship.contactDateEstimated')
        .setOptions(this.yesNoList$, this.i18nService),
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
        .setOptions(this.socialRelationshipOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER')
        .setProperty('relationship.clusterId')
        .setOptions(this.clusterList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP')
        .setProperty('relationship.socialRelationshipDetail'),
      new TextSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_COMMENT')
        .setProperty('relationship.comment')
    );

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

    // get address column indexes
    this._addressColumnIndexes = {
      date: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_DATE),
      emailAddress: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS),
      phoneNumber: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      locationId: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_LOCATION),
      city: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_CITY),
      postalCode: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      addressLine1: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      geoLocationLat: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT),
      geoLocationLng: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG),
      geoLocationAccurate: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
    };

    // map address column indexes
    this._addressColumnIndexesMap = Object.assign({}, ...Object.values(this._addressColumnIndexes).map((index: number) => ({ [index]: true })));

    // get pregnancy status column index
    this._pregnancyStatusColumnIndex = this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_PREGNANCY_STATUS);
  }

  /**
   * After changes
   */
  afterChange(event: IHotTableWrapperEvent) {
    // validate if only there are changes
    if (!event.typeSpecificData.changes) {
      return;
    }

    // get the contact date column index
    const lastContactColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_LAST_CONTACT);

    // check if the date of onset or address fields were changed
    let refreshWarning = false;
    let isLastContactDateModified = false;
    event.typeSpecificData.changes.forEach((cell: any) => {
      // cell[0] - row number, cell[1] - column index, cell[2] - old value, cell[3] - new value
      const columnIndex: number = cell[1];

      // check changed column
      if (this._addressColumnIndexesMap[columnIndex]) {
        // address fields
        this.setAddressDate(
          event.sheetTable,
          cell
        );
      } else if (
        columnIndex === lastContactColumnIndex &&
        this.selectedOutbreak.checkLastContactDateAgainstDateOnSet
      ) {
        // validate last contact against date of onset
        isLastContactDateModified = true;
        const mustRefreshWarning = this.checkForLastContactBeforeCaseOnSet(cell);
        refreshWarning = refreshWarning || mustRefreshWarning;
      }
    });

    // show warnings if only last contact cell was modified
    if (isLastContactDateModified) {
      this.showWarnings(refreshWarning);
    }
  }

  /**
   * Check if "Date of Last Contact" is before "Date of Onset" of the source case
   */
  private checkForLastContactBeforeCaseOnSet(
    cell: any
  ): boolean {
    // cell[0] - row number, cell[1] - column index, cell[2] - old value, cell[3] - new value
    const rowNumber = cell[0];
    const newValue = cell[3];
    let refreshWarning = false;

    // check if there is a new value
    if (
      newValue &&
      moment(newValue).isValid() &&
      this.relatedEntityData instanceof CaseModel &&
      this.relatedEntityData.dateOfOnset &&
      moment(newValue).isBefore(moment(this.relatedEntityData.dateOfOnset))
    ) {
      this._warnings.dateOfOnset = moment(this.relatedEntityData.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
      this._warnings.rows[rowNumber + 1] = true;

      refreshWarning = true;
    } else {
      // remove the row if exists
      if (this._warnings.rows[rowNumber + 1]) {
        refreshWarning = true;
        delete this._warnings.rows[rowNumber + 1];
      }
    }

    // return
    return refreshWarning;
  }

  /**
   * Sets "date" address field to current date if it's not set
   */
  private setAddressDate(
    sheetTable: HotTableComponent,
    cell: any[]
  ): void {
    // get cell info
    const rowNumber: number = cell[0];
    const columnIndex: number = cell[1];
    const newValue: string = cell[3];

    // return if the date was manually cleared
    if (this._manualClearedDateCells[rowNumber]) {
      return;
    }

    // check if "date" was changed
    if (columnIndex === this._addressColumnIndexes.date) {
      // save if date was manually cleared
      if (!newValue) {
        this._manualClearedDateCells[rowNumber] = true;
      }

      // return
      return;
    }

    // return if "date" field is filled
    const sheetCore: Handsontable.default = (sheetTable as any).hotInstance;
    if (
      sheetCore.getDataAtCell(
        rowNumber,
        this._addressColumnIndexes.date
      )
    ) {
      return;
    }

    // set "date" address field to current date if at least an address field is filled
    if (this.isAddressFilled(rowNumber)) {
      sheetCore.setDataAtCell(
        rowNumber,
        this._addressColumnIndexes.date,
        moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
      );
    }
  }

  /**
   * Checks if any of the address field is filled
   */
  private isAddressFilled(
    rowNumber: number,
    ignoredColumn: number = this._addressColumnIndexes.date
  ): boolean {
    // sheet core
    const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;

    // check fields
    const indexesFiltered: number[] = Object.values(this._addressColumnIndexes).filter((item) => item !== ignoredColumn);
    for (const column of Object.values(indexesFiltered)) {
      // get "date" column value
      const value: any = sheetCore.getDataAtCell(
        rowNumber,
        column
      );

      // break if any address field is filled
      if (value) {
        return true;
      }
    }

    // no address field filled
    return false;
  }

  /**
   * Show warnings
   */
  private showWarnings(refreshWarning) {
    // hide previous message if the warning message was updated
    if (refreshWarning) {
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
    }

    // show the warning message
    if (Object.keys(this._warnings.rows).length) {
      this.toastV2Service.notice(
        'LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_WARNING_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET',
        {
          dateOfOnset: this._warnings.dateOfOnset,
          rows: Object.keys(this._warnings.rows).join(', ')
        },
        AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
      );
    }
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
   * Retrieve information of related person (Case or Event)
   */
  private retrieveRelatedPerson() {
    if (
      this.selectedOutbreak &&
      this.selectedOutbreak.id &&
      this.relatedEntityType &&
      this.relatedEntityId
    ) {
      // retrieve related person information
      this.entityDataService
        .getEntity(this.relatedEntityType, this.selectedOutbreak.id, this.relatedEntityId)
        .pipe(
          catchError((err) => {
            // show error message
            this.toastV2Service.error(err);

            // navigate to Cases/Events listing page
            this.redirectToRelatedEntityList();

            return throwError(err);
          })
        )
        .subscribe((relatedEntityData: CaseModel | EventModel) => {
          // keep person data
          this.relatedEntityData = relatedEntityData;
        });
    }
  }

  /**
   * Check that we have related Person Type and ID
   */
  private validateRelatedEntity() {
    if (
      this.relatedEntityId &&
      (
        this.relatedEntityType === EntityType.CASE ||
        this.relatedEntityType === EntityType.EVENT
      )
    ) {
      return true;
    }

    // related person data is wrong or missing
    this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_CASE_OR_EVENT_REQUIRED');

    // navigate to Cases/Events listing page
    this.redirectToRelatedEntityList();

    return false;
  }

  /**
   * Redirect to Cases or Events list, based on related Entity Type
   */
  private redirectToRelatedEntityList() {
    if (
      this.relatedEntityType === EntityType.CASE &&
      CaseModel.canList(this.authUser)
    ) {
      this.router.navigate(['/cases']);
    } else if (
      this.relatedEntityType === EntityType.EVENT &&
      EventModel.canList(this.authUser)
    ) {
      this.router.navigate(['/events']);
    } else {
      // NOT SUPPORTED
      if (ContactModel.canList(this.authUser)) {
        this.router.navigate(['/contacts']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  /**
   * Create new Contacts
   */
  addContacts() {
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
            'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_ERROR_MSG'
          );

          // show error
          loadingDialog.close();
          this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_INVALID_FIELDS');
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
                this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_NO_DATA');
              } else {
                // create contacts
                this.contactDataService
                  .bulkAddContacts(
                    this.selectedOutbreak.id,
                    this.relatedEntityType,
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
                            message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_PARTIAL_ERROR_MSG'
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
                              message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_API_ERROR_MSG',
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
                    this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    loadingDialog.close();
                    if (ContactModel.canList(this.authUser)) {
                      this.router.navigate(['/contacts']);
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
