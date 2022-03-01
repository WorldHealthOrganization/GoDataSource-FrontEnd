import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, throwError } from 'rxjs';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { RequestQueryBuilder, RequestRelationBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { RiskLevelModel } from '../../../../core/models/risk-level.model';
import { RiskLevelGroupModel } from '../../../../core/models/risk-level-group.model';
import { catchError, map, mergeMap, share, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { CaseModel } from '../../../../core/models/case.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { AddressModel } from '../../../../core/models/address.model';
import {
  IExportFieldsGroupRequired,
  ExportFieldsGroupModelNameEnum
} from '../../../../core/models/export-fields-group.model';

@Component({
  selector: 'app-contacts-list',
  templateUrl: './contacts-list.component.html'
})
export class ContactsListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [
    new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '.', true)
  ];

  // constants
  Constants = Constants;
  ContactModel = ContactModel;
  OutbreakModel = OutbreakModel;

  // authenticated user
  authUser: UserModel;

  // list of existing contacts
  contactsList$: Observable<ContactModel[]>;
  contactsListCount$: Observable<IBasicCount>;

  // don't display pills by default
  showCountPills: boolean = false;

  outbreakSubscriber: Subscription;

  // user list
  userList$: Observable<UserModel[]>;

  // list of export fields groups
  fieldsGroupList: LabelValuePair[];
  fieldsGroupListRequired: IExportFieldsGroupRequired;

  fieldsGroupListRelationships: LabelValuePair[];
  fieldsGroupListRelationshipsRequired: IExportFieldsGroupRequired;

  // contacts outbreak
  selectedOutbreak: OutbreakModel;

  // address model needed for filters
  filterAddressModel: AddressModel = new AddressModel({
    geoLocationAccurate: null
  });
  filterAddressParentLocationIds: string[] = [];

  // gender list
  genderList$: Observable<any[]>;

  // contacts grouped by risk level
  countedContactsByRiskLevel$: Observable<any[]>;

  // risk level
  riskLevelRefData$: Observable<ReferenceDataCategoryModel>;
  riskLevelsList$: Observable<any[]>;
  riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

  // teams
  teamsList$: Observable<TeamModel[]>;
  teamsListLoadedMap: {
    [teamId: string]: TeamModel
  } = {};
  teamsListLoadedForHeaderSearch: LabelValuePair[];
  teamIdFilterValue: string = 'all';

  // final contact follow-up status
  finalFollowUpStatus$: Observable<any[]>;

  // provide constants to template
  EntityType = EntityType;
  ReferenceDataCategory = ReferenceDataCategory;
  UserSettings = UserSettings;

  // yes / no / all options
  yesNoOptionsList$: Observable<any[]>;
  pregnancyStatusList$: Observable<any[]>;

  // vaccines
  vaccineList$: Observable<any[]>;
  vaccineStatusList$: Observable<any[]>;

  // available side filters
  availableSideFilters: FilterModel[];
  // values for side filter
  savedFiltersType = Constants.APP_PAGE.CONTACTS.value;

  // print daily follow-ups status
  exportContactsDailyFollowUpListUrl: string;
  exportContactsDailyFollowUpListFileName: string;
  exportContactsDailyFollowUpListFileType: ExportDataExtension = ExportDataExtension.PDF;
  exportContactsDailyFollowUpListDialogFields: DialogField[];

  // print daily follow-ups form
  exportContactsDailyFollowUpsFormUrl: string;
  exportContactsDailyFollowUpsFormFileName: string;
  exportContactsDailyFollowUpsFormFileType: ExportDataExtension = ExportDataExtension.PDF;

  exportContactsUrl: string;
  contactsDataExportFileName: string = moment().format('YYYY-MM-DD');
  allowedExportTypes: ExportDataExtension[] = [
    ExportDataExtension.CSV,
    ExportDataExtension.XLS,
    ExportDataExtension.XLSX,
    ExportDataExtension.JSON,
    ExportDataExtension.ODS,
    ExportDataExtension.PDF
  ];

  // include case data in contact export ?
  contactExtraDialogFields: DialogField[] = [
    new DialogField({
      name: 'includeCaseFields',
      placeholder: 'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION',
      description: 'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION_DESCRIPTION',
      fieldType: DialogFieldType.BOOLEAN
    })
  ];

  // anonymize fields
  anonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_GENDER', 'gender'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH', 'dob'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_AGE', 'age'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ADDRESSES', 'addresses'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_TYPE', 'type'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_VISUAL_ID', 'visualId'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_WAS_CASE', 'wasCase'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_WAS_CONTACT', 'wasContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT', 'dateBecomeContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_OUTCOME_ID', 'outcomeId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_SAFE_BURIAL', 'safeBurial'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', 'dateOfBurial'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP', 'followUp'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', 'dateOfLastContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', 'numberOfExposures'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS', 'numberOfContacts'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', 'vaccinesReceived'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', 'pregnancyStatus'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RELATIONSHIP', 'relationship'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID', 'followUpTeamId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', 'responsibleUserId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers')
  ];

  // relationship anonymize fields
  relationshipAnonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', 'sourcePerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_TARGET', 'targetPerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', 'dateOfFirstContact'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', 'contactDate'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', 'contactDateEstimated'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', 'certaintyLevelId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', 'exposureTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', 'exposureFrequencyId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', 'exposureDurationId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION', 'socialRelationshipTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', 'socialRelationshipDetail'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', 'clusterId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', 'comment'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn')
  ];

  recordActions: HoverRowAction[] = [
    // View Contact
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_CONTACT',
      linkGenerator: (item: ContactModel): string[] => {
        return ['/contacts', item.id, 'view'];
      },
      visible: (item: ContactModel): boolean => {
        return !item.deleted &&
                    ContactModel.canView(this.authUser);
      }
    }),

    // Modify Contact
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_CONTACTS_ACTION_MODIFY_CONTACT',
      linkGenerator: (item: ContactModel): string[] => {
        return ['/contacts', item.id, 'modify'];
      },
      visible: (item: ContactModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ContactModel.canModify(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_CONTACT',
          click: (item: ContactModel) => {
            this.deleteContact(item);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canDelete(this.authUser);
          }
        }),

        // Convert Contact to Case
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_TO_CASE',
          click: (item: ContactModel) => {
            this.convertContactToCase(item);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canConvertToCase(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canConvertToCase(this.authUser);
          }
        }),

        // Add contact of contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_ADD_CONTACT_OF_CONTACT',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts-of-contacts', 'create'], {
              queryParams: {
                entityId: item.id
              }
            });
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.selectedOutbreak.isContactsOfContactsActive &&
                            ContactModel.canCreateContactOfContact(this.authUser) &&
                            ContactOfContactModel.canCreate(this.authUser);
          }
        }),

        // Bulk add contacts of contacts
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_BULK_ADD_CONTACTS',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts-of-contacts', 'create-bulk'], {
              queryParams: {
                entityId: item.id
              }
            });
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.selectedOutbreak.isContactsOfContactsActive &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactOfContactModel.canBulkCreate(this.authUser) &&
                            ContactModel.canBulkCreateContactOfContact(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.selectedOutbreak.isContactsOfContactsActive;
          }
        }),

        // Add Follow-up to Contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_ADD_FOLLOW_UP',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts', item.id, 'follow-ups', 'create']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canCreate(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canCreate(this.authUser);
          }
        }),

        // See contact exposures
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
          click: (item: ContactModel) => {
            this.router.navigate(['/relationships', EntityType.CONTACT, item.id, 'exposures']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            ContactModel.canListRelationshipExposures(this.authUser);
          }
        }),

        // See contact contacts of contacts
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
          click: (item: ContactModel) => {
            this.router.navigate(['/relationships', EntityType.CONTACT, item.id, 'contacts']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.selectedOutbreak.isContactsOfContactsActive &&
                            ContactModel.canListRelationshipContacts(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the previous...
            return !item.deleted &&
                            ContactModel.canListRelationshipExposures(this.authUser);
          }
        }),

        // See records detected by the system as duplicates but they were marked as not duplicates
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES',
          click: (item: ContactModel) => {
            this.router.navigate(['/duplicated-records/contacts', item.id, 'marked-not-duplicates']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted;
          }
        }),

        // See contact lab results
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_SEE_LAB_RESULTS',
          click: (item: ContactModel) => {
            this.router.navigate(['/lab-results', 'contacts', item.id]);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            this.selectedOutbreak &&
                            this.selectedOutbreak.isContactLabResultsActive &&
                            LabResultModel.canList(this.authUser) &&
                            ContactModel.canListLabResult(this.authUser);
          }
        }),

        // See contact follow-us
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_FOLLOW_UPS',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts', 'contact-related-follow-ups', item.id]);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            FollowUpModel.canList(this.authUser);
          }
        }),

        // See questionnaire
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_MODIFY_CONTACT_TAB_QUESTIONNAIRE_TITLE',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts', item.id , 'view-questionnaire']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            ContactModel.canView(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactModel): boolean => {
            // visible only if at least one of the previous...
            return !item.deleted &&
                            FollowUpModel.canList(this.authUser);
          }
        }),

        // View Contact movement map
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_MOVEMENT',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts', item.id, 'movement']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            ContactModel.canViewMovementMap(this.authUser);
          }
        }),

        // View Contact chronology timeline
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_CHRONOLOGY',
          click: (item: ContactModel) => {
            this.router.navigate(['/contacts', item.id, 'chronology']);
          },
          visible: (item: ContactModel): boolean => {
            return !item.deleted &&
                            ContactModel.canViewChronologyChart(this.authUser);
          }
        }),

        // Restore a deleted contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_CONTACT',
          click: (item: ContactModel) => {
            this.restoreContact(item);
          },
          visible: (item: ContactModel): boolean => {
            return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canRestore(this.authUser);
          },
          class: 'mat-menu-item-restore'
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private contactDataService: ContactDataService,
    private authDataService: AuthDataService,
    private snackbarService: SnackbarService,
    private outbreakDataService: OutbreakDataService,
    private genericDataService: GenericDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private userDataService: UserDataService,
    private entityHelperService: EntityHelperService,
    private teamDataService: TeamDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // add page title
    this.contactsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_TITLE') +
            ' - ' +
            this.contactsDataExportFileName;

    // export file names
    this.exportContactsDailyFollowUpListFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UP_LIST_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');
    this.exportContactsDailyFollowUpsFormFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UPS_FORM_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
    this.vaccineList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES);
    this.vaccineStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES_STATUS);

    // dialog fields for daily follow-ups print
    this.genericDataService
      .getRangeFollowUpGroupByOptions(true)
      .subscribe((options) => {
        this.exportContactsDailyFollowUpListDialogFields = [
          new DialogField({
            name: 'groupBy',
            placeholder: 'LNG_PAGE_LIST_CONTACTS_EXPORT_FOLLOW_UPS_GROUP_BY_BUTTON',
            inputOptions: options,
            value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
            required: true
          })
        ];
      });

    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
    this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);
    this.riskLevelRefData$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.RISK_LEVEL).pipe(share());
    this.riskLevelsList$ = this.riskLevelRefData$
      .pipe(
        map((data: ReferenceDataCategoryModel) => {
          return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
            new LabelValuePair(entry.value, entry.id, null, null, entry.iconUrl)
          );
        })
      );
    this.riskLevelRefData$.subscribe((riskCategory: ReferenceDataCategoryModel) => {
      this.riskLevelsListMap = _.transform(
        riskCategory.entries,
        (result, entry: ReferenceDataEntryModel) => {
          // groupBy won't work here since groupBy will put an array instead of one value
          result[entry.id] = entry;
        },
        {}
      );
    });

    // yes / no
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // retrieve teams
    if (TeamModel.canList(this.authUser)) {
      this.teamsList$ = this.teamDataService.getTeamsListReduced().pipe(share());
      this.teamsList$
        .subscribe((teamsList) => {
          // format search options
          this.teamsListLoadedMap = {};
          this.teamsListLoadedForHeaderSearch = [
            new LabelValuePair(
              'LNG_COMMON_LABEL_ALL',
              this.teamIdFilterValue
            )
          ];
          (teamsList || []).forEach((team: TeamModel) => {
            // map for easy access if we don't have access to write data to follow-ups
            this.teamsListLoadedMap[team.id] = team;

            // header search
            this.teamsListLoadedForHeaderSearch.push(
              new LabelValuePair(
                team.name,
                team.id
              )
            );
          });
        });
    }

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // export contacts url
        this.exportContactsUrl = null;
        this.exportContactsDailyFollowUpListUrl = null;
        this.exportContactsDailyFollowUpsFormUrl = null;
        if (
          this.selectedOutbreak &&
                    this.selectedOutbreak.id
        ) {
          this.exportContactsUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/export`;
          this.exportContactsDailyFollowUpListUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/daily-list/export`;
          this.exportContactsDailyFollowUpsFormUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/export-daily-follow-up-form`;

          // initialize side filters
          this.initializeSideFilters();
        }

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });

    // retrieve the list of export fields groups
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT)
      .subscribe((fieldsGroupList) => {
        this.fieldsGroupList = fieldsGroupList.toLabelValuePair(this.i18nService);
        this.fieldsGroupListRequired = fieldsGroupList.toRequiredList();
      });

    // retrieve the list of export fields groups for relationships
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
      .subscribe((fieldsGroupList) => {
        this.fieldsGroupListRelationships = fieldsGroupList.toLabelValuePair(this.i18nService);
        this.fieldsGroupListRelationshipsRequired = fieldsGroupList.toRequiredList();
      });

    // initialize Side Table Columns
    this.initializeSideTableColumns();
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
     * Initialize Side Table Columns
     */
  initializeSideTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'checkbox',
    //     required: true,
    //     excludeFromSave: true
    //   }),
    //   new VisibleColumnModel({
    //     field: 'lastName',
    //     label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'firstName',
    //     label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'visualId',
    //     label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'location',
    //     label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_LOCATION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.emailAddress',
    //     label: 'LNG_CONTACT_FIELD_LABEL_EMAIL',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.addressLine1',
    //     label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.city',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.geoLocation.lat',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.geoLocation.lng',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.postalCode',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'addresses.geoLocationAccurate',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'age',
    //     label: 'LNG_CONTACT_FIELD_LABEL_AGE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'gender',
    //     label: 'LNG_CONTACT_FIELD_LABEL_GENDER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'phoneNumber',
    //     label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'riskLevel',
    //     label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'dateOfLastContact',
    //     label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'followUpTeamId',
    //     label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
    //     visible: false,
    //     excludeFromDisplay: (): boolean => {
    //       return !TeamModel.canList(this.authUser);
    //     }
    //   }),
    //   new VisibleColumnModel({
    //     field: 'followUp.endDate',
    //     label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'followUp.status',
    //     label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'wasCase',
    //     label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'responsibleUserId',
    //     label: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
    //     visible: false,
    //     excludeFromDisplay: (): boolean => {
    //       return !UserModel.canList(this.authUser);
    //     }
    //   }),
    //   new VisibleColumnModel({
    //     field: 'numberOfContacts',
    //     label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'numberOfExposures',
    //     label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'deleted',
    //     label: 'LNG_CONTACT_FIELD_LABEL_DELETED',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdBy',
    //     label: 'LNG_CONTACT_FIELD_LABEL_CREATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_CONTACT_FIELD_LABEL_CREATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedBy',
    //     label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedAt',
    //     label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_AT',
    //     visible: false
    //   })
    // ];
  }

  /**
     * Initialize Side Filters
     */
  initializeSideFilters() {
    const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
    const dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

    // case condition
    const caseCondition = new RequestQueryBuilder();
    caseCondition.filter.byEquality(
      'type',
      EntityType.CASE
    );

    // set available side filters
    this.availableSideFilters = [
      // Contact
      new FilterModel({
        fieldName: 'firstName',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'lastName',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'occupation',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        type: FilterType.MULTISELECT,
        options$: occupationsList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'age',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_AGE',
        type: FilterType.RANGE_AGE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateOfReporting',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dob',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'visualId',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        type: FilterType.TEXT
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        type: FilterType.ADDRESS,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        type: FilterType.ADDRESS_PHONE_NUMBER,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'followUp.status',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        type: FilterType.MULTISELECT,
        options$: this.finalFollowUpStatus$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'followUp.endDate',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateOfLastContact',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'questionnaireAnswers',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        type: FilterType.QUESTIONNAIRE_ANSWERS,
        questionnaireTemplate: this.selectedOutbreak.contactInvestigationTemplate
      }),
      new FilterModel({
        fieldName: 'pregnancyStatus',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        type: FilterType.SELECT,
        options$: this.pregnancyStatusList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.vaccine',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_VACCINE',
        type: FilterType.MULTISELECT,
        options$: this.vaccineList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.status',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        type: FilterType.MULTISELECT,
        options$: this.vaccineStatusList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.date',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_VACCINE_DATE',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'wasCase',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsList$
      }),
      new FilterModel({
        fieldName: 'numberOfContacts',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        type: FilterType.RANGE_NUMBER
      }),
      new FilterModel({
        fieldName: 'numberOfExposures',
        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        type: FilterType.RANGE_NUMBER
      })
    ];

    // allowed to filter by follow-up team ?
    if (TeamModel.canList(this.authUser)) {
      this.availableSideFilters.push(
        new FilterModel({
          fieldName: 'followUpTeamId',
          fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
          type: FilterType.MULTISELECT,
          options$: this.teamsList$,
          optionsLabelKey: 'name',
          optionsValueKey: 'id'
        })
      );
    }

    // allowed to filter by follow-up user ?
    if (UserModel.canList(this.authUser)) {
      this.availableSideFilters.push(
        new FilterModel({
          fieldName: 'responsibleUserId',
          fieldLabel: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
          type: FilterType.MULTISELECT,
          options$: this.userList$,
          optionsLabelKey: 'name',
          optionsValueKey: 'id'
        })
      );
    }

    // Relation - Follow-up
    if (FollowUpModel.canList(this.authUser)) {
      this.availableSideFilters = [
        ...this.availableSideFilters,
        ...[
          new FilterModel({
            fieldName: 'date',
            fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
            type: FilterType.RANGE_DATE,
            relationshipPath: ['followUps'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
          }),
          new FilterModel({
            fieldName: 'index',
            fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
            type: FilterType.NUMBER,
            relationshipPath: ['followUps'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
          }),
          new FilterModel({
            fieldName: 'targeted',
            fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
            type: FilterType.SELECT,
            options$: this.yesNoOptionsList$,
            relationshipPath: ['followUps'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
          }),
          new FilterModel({
            fieldName: 'statusId',
            fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
            type: FilterType.SELECT,
            options$: dailyStatusTypeOptions$,
            relationshipPath: ['followUps'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
          }),
          new FilterModel({
            fieldName: 'questionnaireAnswers',
            fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
            type: FilterType.QUESTIONNAIRE_ANSWERS,
            questionnaireTemplate: this.selectedOutbreak.contactFollowUpTemplate,
            relationshipPath: ['followUps'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
          })
        ]
      ];
    }

    // Relation - Cases
    if (CaseModel.canList(this.authUser)) {
      this.availableSideFilters = [
        ...this.availableSideFilters,
        ...[
          new FilterModel({
            fieldName: 'firstName',
            fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
            type: FilterType.TEXT,
            relationshipPath: ['relationships', 'people'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
            extraConditions: caseCondition
          }),
          new FilterModel({
            fieldName: 'lastName',
            fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
            type: FilterType.TEXT,
            relationshipPath: ['relationships', 'people'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
            extraConditions: caseCondition
          }),
          new FilterModel({
            fieldName: 'gender',
            fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
            type: FilterType.MULTISELECT,
            options$: this.genderList$,
            relationshipPath: ['relationships', 'people'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
            extraConditions: caseCondition
          }),
          new FilterModel({
            fieldName: 'age',
            fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
            type: FilterType.RANGE_AGE,
            relationshipPath: ['relationships', 'people'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
            extraConditions: caseCondition
          }),
          new FilterModel({
            fieldName: 'questionnaireAnswers',
            fieldLabel: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
            type: FilterType.QUESTIONNAIRE_ANSWERS,
            questionnaireTemplate: this.selectedOutbreak.caseInvestigationTemplate,
            relationshipPath: ['relationships', 'people'],
            relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
            extraConditions: caseCondition
          })
        ]
      ];
    }
  }

  /**
     * Re(load) the Contacts list
     */
  refreshList(
    finishCallback: (records: any[]) => void,
    triggeredByPageChange: boolean
  ) {
    if (this.selectedOutbreak) {
      // refresh list of contacts grouped by risk level
      if (!triggeredByPageChange) {
        this.getContactsGroupedByRiskLevel();
      }

      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // retrieve location list
      this.queryBuilder.include('locations', true);

      // retrieve the list of Contacts
      this.contactsList$ = this.contactDataService
        .getContactsList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.snackbarService.showApiError(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap(this.checkEmptyList.bind(this)),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (this.selectedOutbreak) {
      // set apply value
      if (applyHasMoreLimit !== undefined) {
        this.applyHasMoreLimit = applyHasMoreLimit;
      }

      // remove paginator from query builder
      const countQueryBuilder = _.cloneDeep(this.queryBuilder);
      countQueryBuilder.paginator.clear();
      countQueryBuilder.sort.clear();

      // apply has more limit
      if (this.applyHasMoreLimit) {
        countQueryBuilder.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.contactsListCount$ = this.contactDataService
        .getContactsCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.snackbarService.showApiError(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  /**
     * Get contacts grouped by risk level
     */
  getContactsGroupedByRiskLevel() {
    if (this.selectedOutbreak) {
      // clone query builder to clear it
      const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
      clonedQueryBuilder.paginator.clear();
      clonedQueryBuilder.sort.clear();

      // ugly hack so we don't have to change API in many place and test the entire project again ( if we changed api to replace regex to $regex many API request would be affected )
      // #TODO - we need to address this issue later by changing all API requests that use convertLoopbackFilterToMongo ( WGD-2854 )
      const addressPhoneCondition = clonedQueryBuilder.filter.get('addresses.phoneNumber');
      if (addressPhoneCondition) {
        const newCondition = JSON.parse(JSON.stringify(addressPhoneCondition).replace(/"regex"/gi, '"$regex"'));
        clonedQueryBuilder.filter.where(newCondition, true);
      }

      // retrieve data
      this.countedContactsByRiskLevel$ = this.riskLevelRefData$
        .pipe(
          mergeMap((refRiskLevel: ReferenceDataCategoryModel) => {
            return this.contactDataService
              .getContactsGroupedByRiskLevel(this.selectedOutbreak.id, clonedQueryBuilder)
              .pipe(
                map((data: RiskLevelGroupModel) => {
                  return _.map(data ? data.riskLevels : [], (item: RiskLevelModel, itemId) => {
                    const refItem: ReferenceDataEntryModel = _.find(refRiskLevel.entries, {id: itemId}) as ReferenceDataEntryModel;
                    return new CountedItemsListItem(
                      item.count,
                      itemId as any,
                      null,
                      refItem ?
                        refItem.getColorCode() :
                        Constants.DEFAULT_COLOR_REF_DATA
                    );
                  });
                })
              );
          })
        );
    }
  }

  /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
  getRiskColor(item: ContactModel) {
    // get risk data color
    const riskData = _.get(this.riskLevelsListMap, item.riskLevel);
    if (riskData) {
      return riskData.colorCode ? riskData.colorCode : '';
    }

    // if we don't have risk data?
    return '';
  }

  /**
     * Delete specific contact that belongs to the selected outbreak
     */
  deleteContact(contact: ContactModel) {
    // show confirm dialog to confirm the action
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT', contact)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete contact
          this.contactDataService
            .deleteContact(this.selectedOutbreak.id, contact.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Restore contact
     */
  restoreContact(contact: ContactModel) {
    // show confirm dialog to confirm the action
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CONTACT', new ContactModel(contact))
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.contactDataService
            .restoreContact(this.selectedOutbreak.id, contact.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Convert a case to a contact
     * @param contactModel
     */
  convertContactToCase(contactModel: ContactModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_CONVERT_CONTACT_TO_CASE', contactModel)
      .subscribe((answer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.contactDataService
            .convertContactToCase(this.selectedOutbreak.id, contactModel.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_CONTACT_TO_CASE_SUCCESS_MESSAGE');
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Export selected records
     */
  exportSelectedContacts() {
    // get list of contacts that we want to export
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect(
      'id',
      selectedRecords,
      true,
      null
    );

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_CONTACTS_EXPORT_TITLE',
      url: this.exportContactsUrl,
      fileName: this.contactsDataExportFileName,

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      exportProgress: (data) => { this.showExportProgress(data); },
      extraDialogFields: [
        new DialogField({
          name: 'includeCaseFields',
          placeholder: 'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION',
          description: 'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION_DESCRIPTION',
          fieldType: DialogFieldType.BOOLEAN
        })
      ],

      // optional
      allowedExportTypes: this.allowedExportTypes,
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      displayUseQuestionVariable: true,
      anonymizeFields: this.anonymizeFields,
      fieldsGroupList: this.fieldsGroupList,
      fieldsGroupListRequired: this.fieldsGroupListRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }


  /**
     * Export contacts dossier
     */
  exportSelectedContactsDossier() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // display export only if we have a selected outbreak
    if (this.selectedOutbreak) {
      // remove id from list
      const anonymizeFields = _.filter(this.anonymizeFields, (value: LabelValuePair) => {
        return value.value !== 'id';
      });

      // display export dialog
      this.dialogService.showExportDialog({
        message: 'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_DOSSIER_DIALOG_TITLE',
        url: `outbreaks/${this.selectedOutbreak.id}/contacts/dossier`,
        fileName: this.contactsDataExportFileName,
        fileType: ExportDataExtension.ZIP,
        displayAnonymize: true,
        anonymizeFields: anonymizeFields,
        anonymizeFieldsKey: 'data',
        extraAPIData: {
          contacts: selectedRecords
        },
        isPOST: true,
        exportStart: () => { this.showLoadingDialog(); },
        exportFinished: () => { this.closeLoadingDialog(); }
      });
    }
  }

  /**
     * Export relationships for selected contacts
     */
  exportSelectedContactsRelationship() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();
    const personsQb = qb.addChildQueryBuilder('person');

    // retrieve only relationships that have at least one persons as desired type
    qb.filter.byEquality(
      'persons.type',
      EntityType.CONTACT
    );

    // id
    personsQb.filter.bySelect('id', selectedRecords, true, null);

    // type
    personsQb.filter.byEquality(
      'type',
      EntityType.CONTACT
    );

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      allowedExportTypes: this.allowedExportTypes,
      anonymizeFields: this.relationshipAnonymizeFields,
      fieldsGroupList: this.fieldsGroupListRelationships,
      fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }

  /**
     * Export Contact Relationships
     */
  exportFilteredContactsRelationships() {
    // construct filter by case query builder
    const qb = new RequestQueryBuilder();
    const personsQb = qb.addChildQueryBuilder('person');

    // retrieve only relationships that have at least one persons as desired type
    qb.filter.byEquality(
      'persons.type',
      EntityType.CONTACT
    );

    // merge query builder
    personsQb.merge(this.queryBuilder);

    // remove pagination
    personsQb.paginator.clear();

    // remove follow-ups filter
    const followUps: RequestRelationBuilder = personsQb.include('followUps');
    personsQb.removeRelation('followUps');

    // check if we have anything to filter by follow-ups
    if (!followUps.queryBuilder.isEmpty()) {
      const followUpQb = qb.addChildQueryBuilder('followUp');
      followUpQb.merge(followUps.queryBuilder);
    }

    // retrieve relationships conditions & remove them so we can check if we need to filter by contacts
    const relationships: RequestRelationBuilder = personsQb.include('relationships');
    personsQb.removeRelation('relationships');

    // attach condition only if not empty
    if (!personsQb.filter.isEmpty()) {
      // filter contacts
      personsQb.filter.byEquality(
        'type',
        EntityType.CONTACT
      );
    }

    // relationships
    if (!relationships.queryBuilder.isEmpty()) {
      // filter by people
      const people = relationships.queryBuilder.include('people');
      if (!people.queryBuilder.isEmpty()) {
        // merge contact & case conditions
        const contactConditions = personsQb.filter.generateCondition();
        personsQb.filter.clear();
        personsQb.filter.where({
          or: [
            contactConditions, {
              and: [
                { type: EntityType.CASE },
                people.queryBuilder.filter.generateCondition()
              ]
            }
          ]
        });
      }
    }

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      allowedExportTypes: this.allowedExportTypes,
      anonymizeFields: this.relationshipAnonymizeFields,
      fieldsGroupList: this.fieldsGroupListRelationships,
      fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }

  /**
     * Modify selected contacts
     */
  bulkModifyContacts() {
    // get list of contacts that we want to modify
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // redirect to modify contacts page
    this.router.navigate(
      ['/contacts', 'modify-bulk'], {
        queryParams: {
          contactIds: JSON.stringify(selectedRecords)
        }
      }
    );
  }

  /**
     * Change Contact Followup status for all records matching this.queryBuilder
     */
  changeContactFinalFollowUpStatus() {
    // to continue we need to make sure we have an outbreak selected
    if (
      !this.selectedOutbreak ||
            !this.selectedOutbreak.id
    ) {
      return;
    }

    // construct query builder user to count & update contacts
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    countQueryBuilder.fields('id', 'followUp');

    // display loading while determining how many records will be deleted
    this.showLoadingDialog();

    // make all requests in parallel
    forkJoin([
      // retrieve follow-up statuses
      this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS),

      // count contacts
      this.contactDataService.getContactsList(this.selectedOutbreak.id, countQueryBuilder)
    ]).subscribe((
      [statuses, records]: [LabelValuePair[], ContactModel[]]
    ) => {
      // hide loading
      this.closeLoadingDialog();

      // display change status dialog
      this.dialogService
        .showInput(
          new DialogConfiguration({
            message: 'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_TITLE',
            translateData: {
              count: records.length
            },
            yesLabel: 'LNG_COMMON_BUTTON_UPDATE',
            fieldsList: [
              new DialogField({
                name: 'followUp.status',
                placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
                description: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS_DESCRIPTION',
                required: true,
                fieldType: DialogFieldType.SELECT,
                inputOptionsMultiple: false,
                inputOptionsClearable: false,
                inputOptions: statuses
              })
            ]
          })
        )
        .subscribe((answer: DialogAnswer) => {
          if (answer.button === DialogAnswerButton.Yes) {
            // update contacts
            const putRecordsData = records.map((contact: ContactModel) => ({
              id: contact.id,
              followUp: Object.assign(
                contact.followUp, {
                  status: answer.inputValue.value.followUp.status
                }
              )
            }));

            // display loading while determining how many records will be deleted
            this.showLoadingDialog();

            // update statuses
            this.contactDataService
              .bulkModifyContacts(
                this.selectedOutbreak.id,
                putRecordsData
              )
              .pipe(
                catchError((err) => {
                  this.closeLoadingDialog();
                  this.snackbarService.showApiError(err);
                  return throwError(err);
                })
              )
              .subscribe(() => {
                // success message
                this.snackbarService.showSuccess(
                  'LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE', {
                    count: records.length
                  }
                );

                // close dialog
                this.closeLoadingDialog();

                // refresh list
                this.needsRefreshList(true);
              });
          }
        });
    });
  }

  /**
     * Display contacts popup
     */
  displayContacts(entity: ContactModel) {
    // if we do not have contacts return
    if (entity.numberOfContacts < 1) {
      return;
    }

    // display dialog
    this.entityHelperService.displayContacts(
      this.selectedOutbreak.id,
      entity
    );
  }

  /**
     * Display exposures popup
     */
  displayExposures(entity: ContactModel) {
    // if we do not have any exposure return
    if (entity.numberOfExposures < 1) {
      return;
    }

    // display dialog
    this.entityHelperService.displayExposures(
      this.selectedOutbreak.id,
      entity
    );
  }

  /**
     * Filter by team
     */
  filterByTeam(data: LabelValuePair) {
    // nothing to retrieve ?
    if (!data) {
      // no team
      this.queryBuilder.filter.where({
        followUpTeamId: {
          eq: null
        }
      });

      // refresh list
      this.needsRefreshList();
    } else {
      // retrieve everything?
      if (data.value === this.teamIdFilterValue) {
        this.filterBySelectField('followUpTeamId', []);
      } else {
        this.filterBySelectField('followUpTeamId', data);
      }
    }
  }

  /**
     * Redirect to import relationship page
     */
  goToRelationshipImportPage() {
    this.router.navigate(['/import-export-data', 'relationships', 'import'], {
      queryParams: {
        from: Constants.APP_PAGE.CONTACTS.value
      }
    });
  }
}
