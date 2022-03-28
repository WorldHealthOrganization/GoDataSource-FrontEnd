import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as _ from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError, map, mergeMap, share, switchMap, takeUntil } from 'rxjs/operators';

import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder, RequestRelationBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AddressModel } from '../../../../core/models/address.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { Constants } from '../../../../core/models/constants';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import {
  ExportFieldsGroupModelNameEnum,
  IExportFieldsGroupRequired,
} from '../../../../core/models/export-fields-group.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import {
  ReferenceDataCategory,
  ReferenceDataCategoryModel,
  ReferenceDataEntryModel,
} from '../../../../core/models/reference-data.model';
import { RiskLevelGroupModel } from '../../../../core/models/risk-level-group.model';
import { RiskLevelModel } from '../../../../core/models/risk-level.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import {
  ExportDataMethod,
  IV2ExportDataConfigGroupsRequired,
} from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { CountedItemsListItem, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import {
  IV2ColumnPinned,
  IV2ColumnStatusFormType,
  V2ColumnFormat,
  V2ColumnStatusForm,
} from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import {
  V2SideDialogConfigInputType,
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-contacts-of-contacts-list',
  templateUrl: './contacts-of-contacts-list.component.html'
})
export class ContactsOfContactsListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '.', true)
  // ];

  // constants
  Constants = Constants;
  ContactOfContactModel = ContactOfContactModel;
  OutbreakModel = OutbreakModel;
  UserModel = UserModel;

  // address model needed for filters
  filterAddressModel: AddressModel = new AddressModel({
    geoLocationAccurate: null
  });
  filterAddressParentLocationIds: string[] = [];

  // list of existing contacts
  contactsOfContactsList$: Observable<ContactOfContactModel[]>;
  contactsOfContactsListCount$: Observable<IBasicCount>;

  // don't display pills by default
  showCountPills: boolean = false;

  outbreakSubscriber: Subscription;

  // list of export fields groups
  fieldsGroupList: LabelValuePair[];
  fieldsGroupListRequired: IExportFieldsGroupRequired;

  fieldsGroupListRelationships: LabelValuePair[];
  fieldsGroupListRelationshipsRequired: IExportFieldsGroupRequired;

  // gender list
  genderList$: Observable<any[]>;

  // contacts grouped by risk level
  countedContactsOfContactsByRiskLevel$: Observable<any[]>;

  // risk level
  riskLevelRefData$: Observable<ReferenceDataCategoryModel>;
  riskLevelsList$: Observable<any[]>;
  riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

  // provide constants to template
  EntityType = EntityType;
  ReferenceDataCategory = ReferenceDataCategory;
  UserSettings = UserSettings;

  // yes / no / all options
  yesNoOptionsList$: Observable<any[]>;

  // available side filters
  availableSideFilters: FilterModel[];
  // values for side filter
  savedFiltersType = Constants.APP_PAGE.CONTACTS.value;

  exportContactsOfContactsUrl: string;
  contactsOfContactsDataExportFileName: string = moment().format('YYYY-MM-DD');
  allowedExportTypes: ExportDataExtension[] = [
    ExportDataExtension.CSV,
    ExportDataExtension.XLS,
    ExportDataExtension.XLSX,
    ExportDataExtension.JSON,
    ExportDataExtension.ODS,
    ExportDataExtension.PDF
  ];

  anonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP', 'relationship'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER', 'gender'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE', 'age'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB', 'dob'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', 'dateOfLastContact'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OUTCOME_ID', 'outcomeId'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID', 'visualId'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_TYPE', 'type'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', 'numberOfExposures'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_ADDRESSES', 'addresses'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_IS_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_SAFE_BURIAL', 'safeBurial'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', 'dateOfBurial'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', 'vaccinesReceived'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', 'pregnancyStatus'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', 'responsibleUserId'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_WAS_CASE', 'wasCase'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_WAS_CONTACT', 'wasContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT', 'dateBecomeContact'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused'),
    new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ID', 'id')
  ];

  contactsOfContactsAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME', value: 'firstName'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP', value: 'relationship'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME', value: 'middleName'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME', value: 'lastName'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER', value: 'gender'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION', value: 'occupation'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE', value: 'age'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB', value: 'dob'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS', value: 'documents'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', value: 'dateOfLastContact'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL', value: 'riskLevel'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON', value: 'riskReason'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OUTCOME_ID', value: 'outcomeId'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', value: 'dateOfOutcome'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID', value: 'visualId'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_TYPE', value: 'type'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures'},
    { label: 'LNG_CASE_FIELD_LABEL_ADDRESSES', value: 'addresses'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_IS_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_SAFE_BURIAL', value: 'safeBurial'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', value: 'dateOfBurial'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', value: 'vaccinesReceived'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', value: 'pregnancyStatus'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUserId'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn'},
    { label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION', value: 'classification'},
    { label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE', value: 'wasCase'},
    { label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT', value: 'wasContact'},
    { label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT', value: 'dateBecomeContact'},
    { label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', value: 'transferRefused'},
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ID', value: 'id'},
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
      iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CONTACT_OF_CONTACT',
      linkGenerator: (item: ContactOfContactModel): string[] => {
        return ['/contacts-of-contacts', item.id, 'view'];
      },
      visible: (item: ContactOfContactModel): boolean => {
        return !item.deleted &&
                    ContactOfContactModel.canView(this.authUser);
      }
    }),

    // Modify Contact
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACT_OF_CONTACT',
      linkGenerator: (item: ContactOfContactModel): string[] => {
        return ['/contacts-of-contacts', item.id, 'modify'];
      },
      visible: (item: ContactOfContactModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ContactOfContactModel.canModify(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_CONTACT_OF_CONTACT',
          click: (item: ContactOfContactModel) => {
            this.deleteContactOfContact(item);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactOfContactModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactOfContactModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
          }
        }),

        // See contact exposures
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
          click: (item: ContactOfContactModel) => {
            this.router.navigate(['/relationships', EntityType.CONTACT_OF_CONTACT, item.id, 'exposures']);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted &&
                            ContactOfContactModel.canListRelationshipExposures(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: ContactOfContactModel): boolean => {
            // visible only if at least one of the previous...
            return !item.deleted;
          }
        }),

        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES',
          click: (item: ContactOfContactModel) => {
            this.router.navigate(['/duplicated-records/contacts-of-contacts', item.id, 'marked-not-duplicates']);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted;
          }
        }),

        // View Contact movement map
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_MOVEMENT',
          click: (item: ContactOfContactModel) => {
            this.router.navigate(['/contacts-of-contacts', item.id, 'movement']);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted && ContactOfContactModel.canViewMovementMap(this.authUser);
          }
        }),

        // View Contact chronology timeline
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CHRONOLOGY',
          click: (item: ContactOfContactModel) => {
            this.router.navigate(['/contacts-of-contacts', item.id, 'chronology']);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted && ContactOfContactModel.canViewChronologyChart(this.authUser);
          }
        }),

        // Restore a deleted contact
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_CONTACT_OF_CONTACTS',
          click: (item: ContactOfContactModel) => {
            this.restoreContactOfContact(item);
          },
          visible: (item: ContactOfContactModel): boolean => {
            return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactOfContactModel.canRestore(this.authUser);
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
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private genericDataService: GenericDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private locationDataService: LocationDataService,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private entityHelperService: EntityHelperService,
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // add page title
    this.contactsOfContactsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE') +
            ' - ' +
            this.contactsOfContactsDataExportFileName;

    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
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

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // export contacts url
        this.exportContactsOfContactsUrl = null;
        if (
          this.selectedOutbreak &&
                    this.selectedOutbreak.id
        ) {
          this.exportContactsOfContactsUrl = `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/export`;

          // initialize side filters
          this.initializeSideFilters();
        }

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });

    // retrieve the list of export fields groups
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT_OF_CONTACT)
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

    this.initializeQuickActions();

    this.initializeGroupActions();

    this.initializeGroupedData();
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  protected initializeTableColumns() {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: null,
    });

    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
        },
      },
      {
        field: 'middleName',
        label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        notVisible: true,
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
        },
      },
      {
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
        },
      },
      {
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
        },
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // risk
          {
            title: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            items: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.TRIANGLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          }
        ],
        forms: (_column, data: ContactOfContactModel): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // risk
          const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;
          if (
            data.id &&
            risk.map[data.id]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.TRIANGLE,
              color: risk.map[data.id].getColorCode()
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'location',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        format: {
          type: 'mainAddress.location.name',
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true,
        },
        link: (data) => {
          return data.mainAddress?.location?.name
            ? `/locations/${data.mainAddress.location.id}/view`
            : undefined;
        },
      },
      {
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
      },
      {
        field: 'addresses.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true,
      },
      {
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_FIELD_LABEL_EMAIL',
        notVisible: true,
        format: {
          type: 'mainAddress.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true,
      },
      {
        field: 'addresses.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lat'
        }
      },
      {
        field: 'addresses.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lng'
        }
      },
      {
        field: 'addresses.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        format: {
          type: 'mainAddress.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true,
      },
      {
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true,
          options: this.activatedRoute.snapshot.data.yesNoAll
        },
        sortable: true
      },
      {
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        format: {
          type: V2ColumnFormat.AGE
        },
        sortable: true,
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
        }
      },
      {
        field: 'gender',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        format: {
          type: 'mainAddress.phoneNumber'
        },
        sortable: true,
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        }
      },
      {
        field: 'riskLevel',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
        sortable: true,
      },
      {
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true,
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${data.responsibleUserId}/view` :
            undefined;
        }
      },
      {
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        },
        sortable: true,
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => (item.numberOfExposures || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have exposures return
          if (item.numberOfExposures < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.exposures(
            this.selectedOutbreak,
            item
          );
        },
        disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipExposures(this.authUser)
      },
      {
        field: 'deleted',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED
        },
        sortable: true,
      },
      {
        field: 'createdBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true,
      },
      {
        field: 'updatedBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true,
      },
    ];
  }

  private initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return !this.appliedListFilter;
      },
      menuOptions: [
        // Export contacts of contact
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_BUTTON',
          action: {
            click: () => {
              this.exportContactsOfContacts(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser);
          }
        },

        // Import contacts of contact
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_IMPORT_BUTTON',
          action: {
            link: () => ['/import-export-data', 'contact-of-contact-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser) ||
            ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Export relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_IMPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
          action: {
            click: () => {
              // construct filter by case query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CONTACT_OF_CONTACT
              );

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only cases
                personsQb.filter.byEquality(
                  'type',
                  EntityType.CONTACT_OF_CONTACT
                );
              }

              // export case relationships
              this.exportContactsOfContactsRelationships(qb);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_IMPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
          action: {
            click: () => {
              this.goToRelationshipImportPage();
            }
          },
          visible: (): boolean => {
            return OutbreakModel.canImportRelationship(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        }
      ]
    };
  }

  private initializeGroupActions(): void {
    this.groupActions = [
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect('id', selected, true, null);

            // export
            this.exportContactsOfContacts(qb);
          },
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExport(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        },
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER',
        action: {
          click: (selected: string[]) => {
            // remove id from list
            const anonymizeFields =
              this.contactsOfContactsAnonymizeFields.filter((item) => {
                return item.value !== 'id';
              });

            // export dossier
            this.dialogV2Service.showExportData({
              title: {
                get: () =>
                  'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER_DIALOG_TITLE',
              },
              export: {
                url: `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/dossier`,
                async: false,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant(
                  'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE'
                )} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                extraFormData: {
                  append: {
                    cases: selected,
                  },
                },
                allow: {
                  types: [ExportDataExtension.ZIP],
                  anonymize: {
                    fields: anonymizeFields,
                    key: 'data',
                  },
                },
              },
            });
          },
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExportDossier(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        },
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            const personsQb = qb.addChildQueryBuilder('person');

            // retrieve only relationships that have at least one persons as desired type
            qb.filter.byEquality('persons.type', EntityType.CONTACT_OF_CONTACT);

            // id
            personsQb.filter.bySelect('id', selected, true, null);

            // type
            personsQb.filter.byEquality('type', EntityType.CASE);

            // export case relationships
            this.exportContactsOfContactsRelationships(qb);
          },
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExportRelationships(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        },
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_MODIFY_CONTACTS_OF_CONTACTS',
        action: {
          link: (): string[] => {
            return ['/contacts-of-contacts', 'modify-bulk'];
          },
          linkQueryParams: (selected: string[]): Params => {
            return {
              contactOfContactIds: JSON.stringify(selected),
            };
          },
        },
        visible: (): boolean => {
          return ContactOfContactModel.canBulkModify(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        },
      },
    ];
  }

  private initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SHOW_GROUP_BY_RISK_PILLS',
      click: (
        item,
        group
      ) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // filter by group data
        if (!item) {
          this.filterByEquality(
            'riskLevel',
            null
          );
        } else if (item.label === 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_UNCLASSIFIED') {
          // clear
          this.filterByNotHavingValue('riskLevel');
        } else {
          // search
          this.filterByEquality(
            'riskLevel',
            item.label
          );
        }
      },
      data: {
        loading: false,
        values: [],
        get: (
          gData: IV2GroupedData,
          refreshUI: () => void
        ) => {
          // loading data
          gData.data.loading = true;

          // clone queryBuilder to clear it
          const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
          clonedQueryBuilder.paginator.clear();
          clonedQueryBuilder.sort.clear();
          clonedQueryBuilder.clearFields();

          // load data
          return this.contactsOfContactsDataService
            .getContactsOfContactsGroupedByRiskLevel(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              // group data
              const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;

              let values: {
                label: string,
                value: number,
                color?: string,
                order?: any
              }[] = [];
              Object.keys(countResponse.riskLevels || {}).forEach((riskId) => {
                values.push({
                  label: riskId,
                  value: countResponse.riskLevels[riskId].count,
                  color: risk.map[riskId] ? risk.map[riskId].getColorCode() : Constants.DEFAULT_COLOR_REF_DATA,
                  order: risk.map[riskId]?.order !== undefined ?
                    risk.map[riskId].order :
                    Number.MAX_SAFE_INTEGER
                });
              });

              // sort values either by order or label natural order
              values = values.sort((item1, item2) => {
                // if same order, compare labels
                if (item1.order === item2.order) {
                  return this.i18nService.instant(item1.label).localeCompare(this.i18nService.instant(item2.label));
                }

                // format order
                let order1: number = Number.MAX_SAFE_INTEGER;
                try { order1 = parseInt(item1.order, 10); } catch (e) {}
                let order2: number = Number.MAX_SAFE_INTEGER;
                try { order2 = parseInt(item2.order, 10); } catch (e) {}

                // compare order
                return order1 - order2;
              });

              // set data
              gData.data.values = values.map((item) => {
                return {
                  label: item.label,
                  bgColor: item.color,
                  textColor: Constants.hexColorToTextColor(item.color),
                  value: item.value.toLocaleString('en')
                };
              });

              // finished loading data
              gData.data.loading = false;

              // refresh ui
              refreshUI();
            });
        }
      }
    };
  }

  /**
     * Initialize Side Filters
     */
  initializeSideFilters() {
    const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

    // set available side filters
    this.availableSideFilters = [
      // Contact
      new FilterModel({
        fieldName: 'firstName',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'lastName',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'occupation',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
        type: FilterType.MULTISELECT,
        options$: occupationsList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'age',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        type: FilterType.RANGE_AGE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateOfReporting',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dob',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'visualId',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        type: FilterType.TEXT
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        type: FilterType.ADDRESS,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        type: FilterType.ADDRESS_PHONE_NUMBER,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'dateOfLastContact',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'numberOfExposures',
        fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        type: FilterType.RANGE_NUMBER
      })
    ];

    // allowed to filter by responsible user ?
    if (UserModel.canList(this.authUser)) {
      this.availableSideFilters.push(
        new FilterModel({
          fieldName: 'responsibleUserId',
          fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
          type: FilterType.MULTISELECT,
          // options$: this.userList$,
          optionsLabelKey: 'name',
          optionsValueKey: 'id'
        })
      );
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/version']
        }
      }, {
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Contacts list
   */
  refreshList(
    triggeredByPageChange: boolean
  ) {
    if (this.selectedOutbreak) {
      // refresh list of contacts grouped by risk level
      if (!triggeredByPageChange) {
        this.getContactsOfContactsGroupedByRiskLevel();
      }

      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // retrieve the list of Contacts
      this.contactsOfContactsList$ = this.contactsOfContactsDataService
        .getContactsOfContactsList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          switchMap((data) => {
            // determine locations that we need to retrieve
            const locationsIdsMap: {
              [locationId: string]: true
            } = {};
            data.forEach((item) => {
              (item.addresses || []).forEach((address) => {
                // nothing to add ?
                if (!address?.locationId) {
                  return;
                }

                // add location to list
                locationsIdsMap[address.locationId] = true;
              });
            });

            // determine ids
            const locationIds: string[] = Object.keys(locationsIdsMap);

            // nothing to retrieve ?
            if (locationIds.length < 1) {
              return of(data);
            }

            // construct location query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect(
              'id',
              locationIds,
              false,
              null
            );

            // retrieve locations
            return this.locationDataService
              .getLocationsList(qb)
              .pipe(
                map((locations) => {
                  // map locations
                  const locationsMap: {
                    [locationId: string]: LocationModel
                  } = {};
                  locations.forEach((location) => {
                    locationsMap[location.id] = location;
                  });

                  // set locations
                  data.forEach((item) => {
                    (item.addresses || []).forEach((address) => {
                      address.location = address.locationId && locationsMap[address.locationId] ?
                        locationsMap[address.locationId] :
                        address.location;
                    });
                  });

                  // finished
                  return data;
                })
              );
          })
        )
        .pipe(

          // handle errors
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (!this.selectedOutbreak) {
      return;
    }

    // reset
    this.pageCount = undefined;

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
    this.contactsOfContactsDataService.getContactsOfContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(
      // error
      catchError((err) => {
        this.toastV2Service.error(err);
        return throwError(err);
      }),

      // should be the last pipe
      takeUntil(this.destroyed$)
    ).subscribe((response) => {
      this.pageCount = response;
    });
  }

  /**
     * Get contacts grouped by risk level
     */
  getContactsOfContactsGroupedByRiskLevel() {
    if (this.selectedOutbreak) {
      this.countedContactsOfContactsByRiskLevel$ = this.riskLevelRefData$
        .pipe(
          mergeMap((refRiskLevel: ReferenceDataCategoryModel) => {
            return this.contactsOfContactsDataService
              .getContactsOfContactsGroupedByRiskLevel(this.selectedOutbreak.id, this.queryBuilder)
              .pipe(
                map((data: RiskLevelGroupModel) => {
                  return _.map(data ? data.riskLevels : [], (item: RiskLevelModel, itemId) => {
                    const refItem: ReferenceDataEntryModel = _.find(refRiskLevel.entries, {id: itemId}) as ReferenceDataEntryModel;
                    return new CountedItemsListItem(
                      item.count,
                      itemId as any,
                      item.contactIDs,
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
  getRiskColor(item: ContactOfContactModel) {
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
     * @param {ContactOfContactModel} contactOfContact
     */
  deleteContactOfContact(contactOfContact: ContactOfContactModel) {
    // show confirm dialog to confirm the action
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT_OF_CONTACT', contactOfContact)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete contact
          this.contactsOfContactsDataService
            .deleteContactOfContact(this.selectedOutbreak.id, contactOfContact.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err.message);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Restore contact of contact
     * @param contactOfContact
     */
  restoreContactOfContact(contactOfContact: ContactOfContactModel) {
    // show confirm dialog to confirm the action
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CONTACT_OF_CONTACT', new ContactOfContactModel(contactOfContact))
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.contactsOfContactsDataService
            .restoreContactOfContact(this.selectedOutbreak.id, contactOfContact.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err.message);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  exportContactsOfContacts(qb: RequestQueryBuilder): void {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_CASES_EXPORT_TITLE'
      },
      load: (finished) => {
        // retrieve the list of export fields groups for model
        this.outbreakDataService
          .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT_OF_CONTACT)
          .pipe(
            // handle errors
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // send error further
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          )
          .subscribe((fieldsGroupList) => {
            // set groups
            const contactsOfContactsFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
              label: item.name,
              value: item.name
            }));

            // group restrictions
            const contactsOfContactsFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                queryBuilder: qb,
                allow: {
                  types: [
                    ExportDataExtension.CSV,
                    ExportDataExtension.XLS,
                    ExportDataExtension.XLSX,
                    ExportDataExtension.JSON,
                    ExportDataExtension.ODS,
                    ExportDataExtension.PDF
                  ],
                  encrypt: true,
                  anonymize: {
                    fields: this.anonymizeFields
                  },
                  groups: {
                    fields: contactsOfContactsFieldGroups,
                    required: contactsOfContactsFieldGroupsRequires
                  },
                  dbColumns: true,
                  dbValues: true,
                  jsonReplaceUndefinedWithNull: true,
                  questionnaireVariables: true
                },
                inputs: {
                  append: [
                    {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CONTACT_INFORMATION',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
                      name: 'includeContactFields',
                      checked: false
                    }
                  ]
                }
              }
            });
          });
      }
    });
  }

  /**
     * Export selected records
     */
  exportSelectedContactsOfContacts() {
    // // get list of contacts that we want to export
    // const selectedRecords: false | string[] = this.validateCheckedRecords();
    // if (!selectedRecords) {
    //   return;
    // }
    //
    // // construct query builder
    // const qb = new RequestQueryBuilder();
    // qb.filter.bySelect(
    //   'id',
    //   selectedRecords,
    //   true,
    //   null
    // );
    //
    // // display export dialog
    // this.dialogService.showExportDialog({
    //   // required
    //   message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE',
    //   url: this.exportContactsOfContactsUrl,
    //   fileName: this.contactsOfContactsDataExportFileName,
    //
    //   // configure
    //   isAsyncExport: true,
    //   displayUseDbColumns: true,
    //   displayJsonReplaceUndefinedWithNull: true,
    //   // exportProgress: (data) => { this.showExportProgress(data); },
    //
    //   // // optional
    //   allowedExportTypes: this.allowedExportTypes,
    //   queryBuilder: qb,
    //   displayEncrypt: true,
    //   displayAnonymize: true,
    //   displayFieldsGroupList: true,
    //   anonymizeFields: this.anonymizeFields,
    //   fieldsGroupList: this.fieldsGroupList,
    //   fieldsGroupListRequired: this.fieldsGroupListRequired,
    //   exportStart: () => { this.showLoadingDialog(); },
    //   exportFinished: () => { this.closeLoadingDialog(); }
    // });
  }

  /**
     * Export contacts dossier
     */
  exportSelectedContactsOfContactsDossier() {
    // // get list of selected ids
    // const selectedRecords: false | string[] = this.validateCheckedRecords();
    // if (!selectedRecords) {
    //   return;
    // }
    //
    // // display export only if we have a selected outbreak
    // if (this.selectedOutbreak) {
    //   // remove id from list
    //   const anonymizeFields = _.filter(this.anonymizeFields, (value: LabelValuePair) => {
    //     return value.value !== 'id';
    //   });
    //
    //   // display export dialog
    //   this.dialogService.showExportDialog({
    //     message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER_DIALOG_TITLE',
    //     url: `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/dossier`,
    //     fileName: this.contactsOfContactsDataExportFileName,
    //     fileType: ExportDataExtension.ZIP,
    //     displayAnonymize: true,
    //     anonymizeFields: anonymizeFields,
    //     anonymizeFieldsKey: 'data',
    //     displayFieldsGroupList: true,
    //     fieldsGroupList: this.fieldsGroupList,
    //     fieldsGroupListRequired: this.fieldsGroupListRequired,
    //     extraAPIData: {
    //       contactsOfContacts: selectedRecords
    //     },
    //     isPOST: true,
    //     exportStart: () => { this.showLoadingDialog(); },
    //     exportFinished: () => { this.closeLoadingDialog(); }
    //   });
    // }
  }


  exportContactsOfContactsRelationships(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
        },
        load: (finished) => {
          // retrieve the list of export fields groups for model
          this.outbreakDataService
            .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
            .pipe(
              // handle errors
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // send error further
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((fieldsGroupList) => {
              // set groups
              const relationshipFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

              // group restrictions
              const relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

              // show export
              finished({
                title: {
                  get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.relationshipAnonymizeFields
                    },
                    groups: {
                      fields: relationshipFieldGroups,
                      required: relationshipFieldGroupsRequires
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            });
        }
      });
  }

  /**
     * Export relationships for selected contacts
     */
  exportSelectedContactsOfContactsRelationship() {
    // // get list of selected ids
    // const selectedRecords: false | string[] = this.validateCheckedRecords();
    // if (!selectedRecords) {
    //   return;
    // }
    //
    // // construct query builder
    // const qb = new RequestQueryBuilder();
    // const personsQb = qb.addChildQueryBuilder('person');
    //
    // // retrieve only relationships that have at least one persons as desired type
    // qb.filter.byEquality(
    //   'persons.type',
    //   EntityType.CONTACT_OF_CONTACT
    // );
    //
    // // id
    // personsQb.filter.bySelect('id', selectedRecords, true, null);
    //
    // // type
    // personsQb.filter.byEquality(
    //   'type',
    //   EntityType.CONTACT_OF_CONTACT
    // );
    //
    // // display export dialog
    // this.dialogService.showExportDialog({
    //   // required
    //   message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
    //   url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
    //   fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),
    //
    //   // configure
    //   isAsyncExport: true,
    //   displayUseDbColumns: true,
    //   displayJsonReplaceUndefinedWithNull: true,
    //   // exportProgress: (data) => { this.showExportProgress(data); },
    //
    //   // optional
    //   queryBuilder: qb,
    //   displayEncrypt: true,
    //   displayAnonymize: true,
    //   displayFieldsGroupList: true,
    //   allowedExportTypes: this.allowedExportTypes,
    //   anonymizeFields: this.relationshipAnonymizeFields,
    //   fieldsGroupList: this.fieldsGroupListRelationships,
    //   fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
    //   exportStart: () => { this.showLoadingDialog(); },
    //   exportFinished: () => { this.closeLoadingDialog(); }
    // });
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
      EntityType.CONTACT_OF_CONTACT
    );

    // merge query builder
    personsQb.merge(this.queryBuilder);

    // remove pagination
    personsQb.paginator.clear();

    // retrieve relationships conditions & remove them so we can check if we need to filter by contacts
    const relationships: RequestRelationBuilder = personsQb.include('relationships');
    personsQb.removeRelation('relationships');

    // attach condition only if not empty
    if (!personsQb.filter.isEmpty()) {
      // filter contacts
      personsQb.filter.byEquality(
        'type',
        EntityType.CONTACT_OF_CONTACT
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
      message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      allowedExportTypes: this.allowedExportTypes,
      anonymizeFields: this.relationshipAnonymizeFields,
      fieldsGroupList: this.fieldsGroupListRelationships,
      fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
      // exportStart: () => { this.showLoadingDialog(); },
      // exportFinished: () => { this.closeLoadingDialog(); }
    });
  }

  /**
     * Modify selected contact of contacts
     */
  bulkModifyContactOfContacts() {
    // // get list of contacts that we want to modify
    // const selectedRecords: false | string[] = this.validateCheckedRecords();
    // if (!selectedRecords) {
    //   return;
    // }
    //
    // // redirect to modify contacts page
    // this.router.navigate(
    //   ['/contacts-of-contacts', 'modify-bulk'], {
    //     queryParams: {
    //       contactOfContactIds: JSON.stringify(selectedRecords),
    //     }
    //   }
    // );
  }

  /**
     * Display exposures popup
     */
  displayExposures(entity: ContactOfContactModel) {
    // if we do not have any exposure return
    if (entity.numberOfExposures < 1) {
      return;
    }

    // display dialog
    // this.entityHelperService.displayExposures(
    //   this.selectedOutbreak.id,
    //   entity
    // );
  }

  /**
     * Redirect to import relationship page
     */
  goToRelationshipImportPage() {
    this.router.navigate(['/import-export-data', 'relationships', 'import'], {
      queryParams: {
        from: Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value
      }
    });
  }
}
