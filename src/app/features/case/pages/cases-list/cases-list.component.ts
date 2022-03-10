import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogField, DialogFieldType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Params, Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, map, share, takeUntil, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { AddressModel } from '../../../../core/models/address.model';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { IV2BreadcrumbAction } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';

@Component({
  selector: 'app-cases-list',
  templateUrl: './cases-list.component.html'
})
export class CasesListComponent extends ListComponent implements OnInit, OnDestroy {
  // list of existing cases
  casesList$: Observable<CaseModel[]>;

  // field groups
  private caseFieldGroups: ILabelValuePairModel[];
  private caseFieldGroupsRequires: IV2ExportDataConfigGroupsRequired;
  private relationshipFieldGroups: ILabelValuePairModel[];
  private relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired;

  // case anonymize fields
  private caseAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_CASE_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME', value: 'firstName' },
    { label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME', value: 'middleName' },
    { label: 'LNG_CASE_FIELD_LABEL_LAST_NAME', value: 'lastName' },
    { label: 'LNG_CASE_FIELD_LABEL_GENDER', value: 'gender' },
    { label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER', value: 'phoneNumber' },
    { label: 'LNG_CASE_FIELD_LABEL_OCCUPATION', value: 'occupation' },
    { label: 'LNG_CASE_FIELD_LABEL_DOB', value: 'dob' },
    { label: 'LNG_CASE_FIELD_LABEL_AGE', value: 'age' },
    { label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL', value: 'riskLevel' },
    { label: 'LNG_CASE_FIELD_LABEL_RISK_REASON', value: 'riskReason' },
    { label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS', value: 'documents' },
    { label: 'LNG_CASE_FIELD_LABEL_ADDRESSES', value: 'addresses' },
    { label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION', value: 'classification' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION', value: 'dateOfInfection' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET', value: 'dateOfOnset' },
    { label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE', value: 'isDateOfOnsetApproximate' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME', value: 'dateOfOutcome' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE', value: 'dateBecomeCase' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_RANGES', value: 'dateRanges' },
    { label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' },
    { label: 'LNG_CASE_FIELD_LABEL_TYPE', value: 'type' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate' },
    { label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', value: 'transferRefused' },
    { label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID', value: 'visualId' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT', value: 'wasContact' },
    { label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE', value: 'wasCase' },
    { label: 'LNG_CASE_FIELD_LABEL_OUTCOME_ID', value: 'outcomeId' },
    { label: 'LNG_CASE_FIELD_LABEL_SAFE_BURIAL', value: 'safeBurial' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL', value: 'dateOfBurial' },
    { label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures' },
    { label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS', value: 'numberOfContacts' },
    { label: 'LNG_CASE_FIELD_LABEL_BURIAL_LOCATION_ID', value: 'burialLocationId' },
    { label: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME', value: 'burialPlaceName' },
    { label: 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED', value: 'vaccinesReceived' },
    { label: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS', value: 'pregnancyStatus' },
    { label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUserId' }
  ];

  // relationship anonymize fields
  private relationshipAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', value: 'sourcePerson' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_TARGET', value: 'targetPerson' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', value: 'dateOfFirstContact' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', value: 'contactDate' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', value: 'contactDateEstimated' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', value: 'certaintyLevelId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', value: 'exposureTypeId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', value: 'exposureFrequencyId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', value: 'exposureDurationId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION', value: 'socialRelationshipTypeId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', value: 'socialRelationshipDetail' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', value: 'clusterId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', value: 'comment' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];







  // address model needed for filters
  filterAddressModel: AddressModel = new AddressModel({
    geoLocationAccurate: null
  });
  filterAddressParentLocationIds: string[] = [];

  // don't display pills by default
  showCountPills: boolean = false;

  // user list
  userList$: Observable<UserModel[]>;

  caseClassifications$: Observable<any>;

  caseClassificationsList$: Observable<any[]>;
  caseClassificationsListMap: { [id: string]: ReferenceDataEntryModel };
  genderList$: Observable<any[]>;
  yesNoOptionsList$: Observable<any[]>;
  occupationsList$: Observable<any[]>;
  outcomeList$: Observable<any[]>;
  pregnancyStatsList$: Observable<any[]>;

  // vaccines
  vaccineList$: Observable<any[]>;
  vaccineStatusList$: Observable<any[]>;

  clustersListAsLabelValuePair$: Observable<LabelValuePair[]>;
  caseRiskLevelsList$: Observable<any[]>;
  yesNoOptionsWithoutAllList$: Observable<any[]>;

  // available side filters
  availableSideFilters: FilterModel[] = [];
  // saved filters type
  savedFiltersType = Constants.APP_PAGE.CASES.value;

  // provide constants to template
  Constants = Constants;
  EntityType = EntityType;
  ReferenceDataCategory = ReferenceDataCategory;
  LabResultModel = LabResultModel;
  CaseModel = CaseModel;
  OutbreakModel = OutbreakModel;
  UserModel = UserModel;

  notACaseFilter: boolean | string = false;

  exportCasesUrl: string;
  allowedExportTypes: ExportDataExtension[] = [
    ExportDataExtension.CSV,
    ExportDataExtension.XLS,
    ExportDataExtension.XLSX,
    ExportDataExtension.JSON,
    ExportDataExtension.ODS,
    ExportDataExtension.PDF
  ];

  // include contact data in case export ?
  caseExtraDialogFields: DialogField[] = [
    new DialogField({
      name: 'includeContactFields',
      placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION',
      description: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
      fieldType: DialogFieldType.BOOLEAN
    })
  ];

  // subscribers
  outbreakSubscriber: Subscription;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private caseDataService: CaseDataService,
    private snackbarService: SnackbarService,
    private outbreakDataService: OutbreakDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService,
    private genericDataService: GenericDataService,
    private clusterDataService: ClusterDataService,
    private userDataService: UserDataService,
    private entityHelperService: EntityHelperService,
    private redirectService: RedirectService
  ) {
    super(listHelperService);
  }

  /**
   * Component initialized
   */
  ngOnInit() {
    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    // reference data
    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
    this.caseClassifications$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION).pipe(share());
    this.caseClassificationsList$ = this.caseClassifications$
      .pipe(
        map((data: ReferenceDataCategoryModel) => {
          return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
            new LabelValuePair(entry.value, entry.id, null, null, entry.iconUrl)
          );
        })
      );
    this.caseClassifications$.subscribe((caseClassificationCategory: ReferenceDataCategoryModel) => {
      this.caseClassificationsListMap = _.transform(
        caseClassificationCategory.entries,
        (result, entry: ReferenceDataEntryModel) => {
          // groupBy won't work here since groupBy will put an array instead of one value
          result[entry.id] = entry;
        },
        {}
      );
    });
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
    this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
    this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);
    this.pregnancyStatsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
    this.vaccineList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES);
    this.vaccineStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES_STATUS);

    // init side filters
    this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
    this.yesNoOptionsWithoutAllList$ = this.genericDataService.getFilterYesNoOptions(true);
    this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

    // retrieve the list of export fields groups for model
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CASE)
      .subscribe((fieldsGroupList) => {
        // set groups
        this.caseFieldGroups = fieldsGroupList.options.map((item) => ({
          label: item.name,
          value: item.name
        }));

        // group restrictions
        this.caseFieldGroupsRequires = fieldsGroupList.toRequiredList();
      });

    // retrieve the list of export fields groups for relationships
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
      .subscribe((fieldsGroupList) => {
        // set groups
        this.relationshipFieldGroups = fieldsGroupList.options.map((item) => ({
          label: item.name,
          value: item.name
        }));

        // group restrictions
        this.relationshipFieldGroupsRequires = fieldsGroupList.toRequiredList();
      });

    // initialize table Columns
    this.initializeTableColumns();

    // initialize quick actions
    this.initializeQuickActions();

    // initialize add action
    this.initializeAddAction();

    // initialize grouped data
    this.initializeGroupedData();
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
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // export cases url
    this.exportCasesUrl = null;
    if (
      this.selectedOutbreak &&
      this.selectedOutbreak.id
    ) {
      this.exportCasesUrl = `/outbreaks/${this.selectedOutbreak.id}/cases/export`;

      this.clustersListAsLabelValuePair$ = this.clusterDataService.getClusterListAsLabelValue(this.selectedOutbreak.id);

      // initialize side filters
      this.initializeSideFilters();
    }

    // initialize pagination
    this.initPaginator();
    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT
      },
      {
        field: 'firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT
      },
      {
        field: 'middleName',
        label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        notVisible: true,
        pinned: IV2ColumnPinned.LEFT
      },
      {
        field: 'visualId',
        label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT
      },
      {
        field: 'classification',
        label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION'
      },
      {
        field: 'outcomeId',
        label: 'LNG_CASE_FIELD_LABEL_OUTCOME'
      },
      {
        field: 'dateOfOutcome',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
        format: {
          type: V2ColumnFormat.DATE
        },
        notVisible: true
      },
      {
        field: 'age',
        label: 'LNG_CASE_FIELD_LABEL_AGE',
        format: {
          type: V2ColumnFormat.AGE
        }
      },
      {
        field: 'gender',
        label: 'LNG_CASE_FIELD_LABEL_GENDER'
      },
      {
        field: 'phoneNumber',
        label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
        format: {
          type: 'mainAddress.phoneNumber'
        }
      },
      {
        field: 'location',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        link: (data) => {
          return data.mainAddress?.location?.name ?
            `/locations/${data.mainAddress.location.id}/view` :
            undefined;
        }
      },
      {
        field: 'addresses.emailAddress',
        label: 'LNG_CASE_FIELD_LABEL_EMAIL',
        notVisible: true,
        format: {
          type: 'mainAddress.emailAddress'
        }
      },
      {
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1'
        }
      },
      {
        field: 'addresses.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        }
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
        }
      },
      {
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate'
        }
      },
      {
        field: 'dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'dateOfReporting',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'notACase',
        label: 'LNG_CASE_FIELD_LABEL_NOT_A_CASE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          value: (data) => {
            return data.classification === Constants.CASE_CLASSIFICATION.NOT_A_CASE;
          }
        }
      },
      {
        field: 'wasContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
        },
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${data.responsibleUserId}/view` :
            undefined;
        }
      }
    ];

    // number of contacts & exposures columns should be visible only on pages where we have relationships
    // for cases without relationships we don't need these columns
    if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS) {
      this.tableColumns.push(
        {
          field: 'numberOfContacts',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS'
        },
        {
          field: 'numberOfExposures',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES'
        }
      );
    }

    // rest of columns :)
    this.tableColumns.push(
      {
        field: 'deleted',
        label: 'LNG_CASE_FIELD_LABEL_DELETED',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_CASE_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
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
        label: 'LNG_CASE_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
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
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClasses: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View Case
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CASE',
            action: {
              link: (data: CaseModel): string[] => {
                return ['/cases', data.id, 'view'];
              }
            },
            visible: (item: CaseModel): boolean => {
              return !item.deleted &&
                CaseModel.canView(this.authUser);
            }
          },

          // Modify Case
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_MODIFY_CASE',
            action: {
              link: (item: CaseModel): string[] => {
                return ['/cases', item.id, 'modify'];
              },
            },
            visible: (item: CaseModel): boolean => {
              return !item.deleted &&
                this.selectedOutbreakIsActive &&
                CaseModel.canModify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Case
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_DELETE_CASE',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: CaseModel): void => {
                    // data
                    const message: {
                      get: string,
                      data?: {
                        name: string,
                        numberOfContacts: string
                      }
                    } = {
                      get: ''
                    };

                    // determine what we need to delete
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => message.get,
                          data: () => message.data
                        }
                      },
                      initialized: (handler) => {
                        // display loading
                        handler.loading.show();

                        // determine if case has exposed contacts
                        this.caseDataService
                          .getExposedContactsForCase(this.selectedOutbreak.id, item.id)
                          .subscribe((exposedContacts: { count: number }) => {
                            // set message data
                            message.data = {
                              name: item.name,
                              numberOfContacts: exposedContacts?.count.toLocaleString('en')
                            };

                            // determine message label
                            message.get = !exposedContacts?.count ?
                              'LNG_DIALOG_CONFIRM_DELETE_CASE' :
                              'LNG_DIALOG_CONFIRM_DELETE_CASE_WITH_EXPOSED_CONTACTS';

                            // hide loading
                            handler.loading.hide();
                          });
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete case
                      this.caseDataService
                        .deleteCase(
                          this.selectedOutbreak.id,
                          item.id
                        )
                        .pipe(
                          catchError((err) => {
                            // show error
                            // this.snackbarService.showApiError(err);

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          // this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  },
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canDelete(this.authUser);
                }
              },

              // Convert Case To Contact
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: CaseModel): void => {
                    this.convertCaseToContact(item);
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canConvertToContact(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canConvertToContact(this.authUser);
                }
              },

              // Add Contact to Case
              {
                label: 'LNG_PAGE_ACTION_ADD_CONTACT',
                action: {
                  link: (): string[] => {
                    return ['/contacts', 'create'];
                  },
                  linkQueryParams: (item: CaseModel): Params => {
                    return {
                      entityType: EntityType.CASE,
                      entityId: item.id
                    };
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canCreate(this.authUser) &&
                    CaseModel.canCreateContact(this.authUser);
                }
              },

              // Bulk add contacts to case
              {
                label: 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS',
                action: {
                  link: (): string[] => {
                    return ['/contacts', 'create-bulk'];
                  },
                  linkQueryParams: (item: CaseModel): Params => {
                    return {
                      entityType: EntityType.CASE,
                      entityId: item.id
                    };
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canBulkCreate(this.authUser) &&
                    CaseModel.canBulkCreateContact(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    (
                      (
                        ContactModel.canCreate(this.authUser) &&
                        CaseModel.canCreateContact(this.authUser)
                      ) || (
                        ContactModel.canBulkCreate(this.authUser) &&
                        CaseModel.canBulkCreateContact(this.authUser)
                      )
                    );
                }
              },

              // See case contacts..
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/relationships', EntityType.CASE, item.id, 'contacts'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    CaseModel.canListRelationshipContacts(this.authUser);
                }
              },

              // See case exposures
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/relationships', EntityType.CASE, item.id, 'exposures'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    CaseModel.canListRelationshipExposures(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    (
                      CaseModel.canListRelationshipContacts(this.authUser) ||
                      CaseModel.canListRelationshipExposures(this.authUser)
                    );
                }
              },

              // See records detected by the system as duplicates but they were marked as not duplicates
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_SEE_RECORDS_NOT_DUPLICATES',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/duplicated-records/cases', item.id, 'marked-not-duplicates'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted;
                }
              },

              // See case lab results
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_SEE_LAB_RESULTS',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/lab-results', 'cases', item.id];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    LabResultModel.canList(this.authUser) &&
                    CaseModel.canListLabResult(this.authUser);
                }
              },

              // See contacts follow-us belonging to this case
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_FOLLOW_UPS',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/contacts', 'case-related-follow-ups', item.id];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    FollowUpModel.canList(this.authUser);
                }
              },

              // See questionnaire
              {
                label: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/cases', item.id , 'view-questionnaire'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    CaseModel.canView(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted && (
                    LabResultModel.canList(this.authUser) ||
                    FollowUpModel.canList(this.authUser)
                  );
                }
              },

              // View Case movement map
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_MOVEMENT',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/cases', item.id, 'movement'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    CaseModel.canViewMovementMap(this.authUser);
                }
              },

              // View case chronology timeline
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CHRONOLOGY',
                action: {
                  link: (item: CaseModel): string[] => {
                    return ['/cases', item.id, 'chronology'];
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    CaseModel.canViewChronologyChart(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: CaseModel): boolean => {
                  return !item.deleted && (
                    CaseModel.canViewMovementMap(this.authUser) ||
                    CaseModel.canViewChronologyChart(this.authUser)
                  );
                }
              },

              // Download case investigation form
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_CASE_INVESTIGATION_FORM',
                action: {
                  click: (item: CaseModel) => {
                    this.exportCaseInvestigationForm(item);
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    CaseModel.canExportInvestigationForm(this.authUser);
                }
              },

              // Restore a deleted case
              {
                label: 'LNG_PAGE_LIST_CASES_ACTION_RESTORE_CASE',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: CaseModel) => {
                    this.restoreCase(item);
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canRestore(this.authUser);
                }
              }
            ]
          }
        ]
      }
    );
  }

  /**
   * Initialize quick actions
   */
  initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return CaseModel.canListPersonsWithoutRelationships(this.authUser) ||
          CaseModel.canListOnsetBeforePrimaryReport(this.authUser) ||
          CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser) ||
          CaseModel.canExport(this.authUser) ||
          CaseModel.canImport(this.authUser) ||
          CaseModel.canExportInvestigationForm(this.authUser) ||
          CaseModel.canExportRelationships(this.authUser);
      },
      menuOptions: [
        // DELETE ME
        {
          label: 'DELETE ME',
          action: {
            click: () => {
              this.dialogV2Service.showConfirmDialog({
                config: {
                  title: {
                    get: () => 'some title'
                  },
                  message: {
                    get: () => ''
                  }
                },
                initialized: (handler) => {
                  // display loading
                  handler.loading.show();
                }
              }).subscribe(() => {});
            }
          }
        },

        // No relationships
        {
          label: 'LNG_PAGE_LIST_CASES_ACTION_NO_RELATIONSHIPS_BUTTON',
          action: this.redirectService.linkAndQueryParams(
            ['/cases'],
            {
              applyListFilter: Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS
            }
          ),
          visible: (): boolean => {
            return CaseModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS;
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS;
          }
        },

        // Onset report
        {
          label: 'LNG_PAGE_LIST_CASES_ONSET_REPORT_BUTTON',
          action: {
            link: () => ['/relationships/date-onset']
          },
          visible: (): boolean => {
            return CaseModel.canListOnsetBeforePrimaryReport(this.authUser);
          }
        },

        // Cases long period report
        {
          label: 'LNG_PAGE_LIST_CASES_LONG_PERIOD_REPORT_BUTTON',
          action: {
            link: () => ['/relationships/long-period']
          },
          visible: (): boolean => {
            return CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canListOnsetBeforePrimaryReport(this.authUser) ||
              CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser);
          }
        },

        // Export cases
        {
          label: 'LNG_PAGE_LIST_CASES_EXPORT_BUTTON',
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/cases/export`,
                  async: true,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: this.queryBuilder,
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
                      fields: this.caseAnonymizeFields
                    },
                    groups: {
                      fields: this.caseFieldGroups,
                      required: this.caseFieldGroupsRequires
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
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION',
                        tooltip: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
                        name: 'includeContactFields',
                        checked: false
                      }
                    ]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return CaseModel.canExport(this.authUser);
          }
        },

        // Import cases
        {
          label: 'LNG_PAGE_LIST_CASES_IMPORT_BUTTON',
          action: {
            link: () => ['/import-export-data', 'case-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              CaseModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canExport(this.authUser) ||
              CaseModel.canImport(this.authUser);
          }
        },

        // Empty case investigation form
        {
          label: 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS',
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_TITLE'
                },
                export: {
                  url: `outbreaks/${this.selectedOutbreak.id}/cases/export-investigation-template`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                  allow: {
                    types: [
                      ExportDataExtension.ZIP
                    ]
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.NUMBER,
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_FIELD_COPIES',
                        name: 'copies',
                        value: 5,
                        validators: {
                          required: () => true
                        }
                      }
                    ]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return CaseModel.canExportEmptyInvestigationForms(this.authUser);
          }
        },

        // Export relationships
        {
          label: 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_CASES_RELATIONSHIPS',
          action: {
            click: () => {
              // construct filter by case query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CASE
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
                  EntityType.CASE
                );
              }

              // export
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
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
                      fields: this.relationshipFieldGroups,
                      required: this.relationshipFieldGroupsRequires
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return CaseModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: 'LNG_PAGE_LIST_CASES_ACTION_IMPORT_CASES_RELATIONSHIPS',
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

  /**
   * Initialize add action
   */
  initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/cases', 'create']
      },
      visible: (): boolean => {
        return CaseModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize grouped data
   */
  initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CASES_ACTION_SHOW_GROUP_BY_CLASSIFICATION_PILLS',
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
          return this.caseDataService
            .getCasesGroupedByClassification(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              this.caseClassifications$
                .pipe(
                  // should be the last pipe
                  takeUntil(this.destroyed$)
                )
                .subscribe((refClassificationData: ReferenceDataCategoryModel) => {
                  // map reference data
                  const refDataMap: {
                    [entryId: string]: ReferenceDataEntryModel
                  } = {};
                  refClassificationData.entries.forEach((entry) => {
                    refDataMap[entry.id] = entry;
                  });

                  // group data
                  let values: {
                    label: string,
                    value: number,
                    color?: string,
                    order?: any
                  }[] = [];
                  Object.keys(countResponse.classification || {}).forEach((classificationId) => {
                    values.push({
                      label: classificationId,
                      value: countResponse.classification[classificationId].count,
                      color: refDataMap[classificationId] ? refDataMap[classificationId].getColorCode() : Constants.DEFAULT_COLOR_REF_DATA,
                      order: refDataMap[classificationId].order !== undefined ?
                        refDataMap[classificationId].order :
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
            });
        }
      }
    };
  }

  /**
     * Initialize Side Filters
     */
  initializeSideFilters() {
    // if there is no outbreak, we can't fully initialize side filters
    if (
      !this.selectedOutbreak ||
      !this.selectedOutbreak.id
    ) {
      return;
    }

    // set available side filters
    this.availableSideFilters = [
      // Case
      new FilterModel({
        fieldName: 'firstName',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'middleName',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'lastName',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'gender',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
        type: FilterType.MULTISELECT,
        options$: this.genderList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'age',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
        type: FilterType.RANGE_AGE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        type: FilterType.ADDRESS,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'dob',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DOB',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
        type: FilterType.ADDRESS_PHONE_NUMBER,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'occupation',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
        type: FilterType.MULTISELECT,
        options$: this.occupationsList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'riskLevel',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
        type: FilterType.MULTISELECT,
        options$: this.caseRiskLevelsList$
      }),
      new FilterModel({
        fieldName: 'riskReason',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'visualId',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'classification',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        type: FilterType.MULTISELECT,
        options$: this.caseClassificationsList$
      }),
      new FilterModel({
        fieldName: 'dateOfInfection',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'dateOfOnset',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'dateOfOutcome',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'dateBecomeCase',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'safeBurial',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsWithoutAllList$
      }),
      new FilterModel({
        fieldName: 'isDateOfOnsetApproximate',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsWithoutAllList$
      }),
      new FilterModel({
        fieldName: 'dateOfReporting',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'isDateOfReportingApproximate',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsWithoutAllList$
      }),
      new FilterModel({
        fieldName: 'transferRefused',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsWithoutAllList$
      }),
      new FilterModel({
        fieldName: 'outcomeId',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_OUTCOME',
        type: FilterType.MULTISELECT,
        options$: this.outcomeList$
      }),
      new FilterModel({
        fieldName: 'wasContact',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
        type: FilterType.SELECT,
        options$: this.yesNoOptionsWithoutAllList$
      }),
      new FilterModel({
        fieldName: 'clusterId',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER_NAME',
        type: FilterType.MULTISELECT,
        options$: this.clustersListAsLabelValuePair$,
        relationshipPath: ['relationships'],
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER'
      }),
      new FilterModel({
        fieldName: 'questionnaireAnswers',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        type: FilterType.QUESTIONNAIRE_ANSWERS,
        questionnaireTemplate: this.selectedOutbreak.caseInvestigationTemplate
      }),
      new FilterModel({
        fieldName: 'pregnancyStatus',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
        type: FilterType.MULTISELECT,
        options$: this.pregnancyStatsList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.vaccine',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE',
        type: FilterType.MULTISELECT,
        options$: this.vaccineList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.status',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE_STATUS',
        type: FilterType.MULTISELECT,
        options$: this.vaccineStatusList$
      }),
      new FilterModel({
        fieldName: 'vaccinesReceived.date',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE_DATE',
        type: FilterType.RANGE_DATE
      }),
      new FilterModel({
        fieldName: 'numberOfContacts',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS',
        type: FilterType.RANGE_NUMBER
      }),
      new FilterModel({
        fieldName: 'numberOfExposures',
        fieldLabel: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        type: FilterType.RANGE_NUMBER
      })
    ];

    // allowed to filter by responsible user ?
    if (UserModel.canList(this.authUser)) {
      this.availableSideFilters.push(
        new FilterModel({
          fieldName: 'responsibleUserId',
          fieldLabel: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
          type: FilterType.MULTISELECT,
          options$: this.userList$,
          optionsLabelKey: 'name',
          optionsValueKey: 'id'
        })
      );
    }
  }

  /**
     * Classification conditions
     */
  private addClassificationConditions() {
    // create classification condition
    const trueCondition = {classification: {eq: Constants.CASE_CLASSIFICATION.NOT_A_CASE}};
    const falseCondition = {classification: {neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE}};

    // remove existing filter
    this.queryBuilder.filter.removeExactCondition(trueCondition);
    this.queryBuilder.filter.removeExactCondition(falseCondition);

    // filter by classification
    if (this.notACaseFilter === true) {
      // show cases that are NOT classified as Not a Case
      this.queryBuilder.filter.where(trueCondition);
    } else if (this.notACaseFilter === false) {
      // show cases classified as Not a Case
      this.queryBuilder.filter.where(falseCondition);
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // determine if cases page should be linkable
    let casesAction: IV2BreadcrumbAction = null;

    // if we have an applied filter then we need to add breadcrumb
    if (this.appliedListFilter === ApplyListFilter.CASES_WITHOUT_RELATIONSHIPS) {
      // since we need to send user to the same page we need to do some hacks...
      const redirect = this.redirectService.linkAndQueryParams(
        ['/cases']
      );
      casesAction = {
        link: redirect.link(),
        linkQueryParams: redirect.linkQueryParams()
      };
    }

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
        action: casesAction
      }
    ];

    // if we have an applied filter then we need to add breadcrumb
    if (this.appliedListFilter === ApplyListFilter.CASES_WITHOUT_RELATIONSHIPS) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_DASHBOARD_CASES_WITHOUT_RELATIONSHIPS',
        action: null
      });
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'firstName',
      'middleName',
      'visualId',
      'classification',
      'outcomeId',
      'dateOfOutcome',
      'age',
      'gender',
      'addresses',
      'locations',
      'dateOfOnset',
      'dateOfReporting',
      'wasContact',
      'responsibleUserId',
      'numberOfContacts',
      'numberOfExposures',
      'deleted',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Cases list, based on the applied filter, sort criterias
   */
  refreshList(
    finishCallback: (records: any[]) => void,
    triggeredByPageChange: boolean
  ) {
    if (this.selectedOutbreak) {
      // classification conditions - not really necessary since refreshListCount is always called before this one
      this.addClassificationConditions();

      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // retrieve location list
      this.queryBuilder.include('locations', true);

      // refresh badges list with applied filter
      if (!triggeredByPageChange) {
        this.initializeGroupedData();
      }

      // retrieve the list of Cases
      this.casesList$ = this.caseDataService
        .getCasesList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.snackbarService.showApiError(err);
            finishCallback([]);
            return throwError(err);
          }),
          map((cases: CaseModel[]) => {
            return EntityModel.determineAlertness(
              this.selectedOutbreak.caseInvestigationTemplate,
              cases
            );
          }),
          tap(this.checkEmptyList.bind(this)),
          tap((data: any[]) => {
            finishCallback(data);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    } else {
      finishCallback([]);
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

    // classification conditions
    this.addClassificationConditions();

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
    this.caseDataService
      .getCasesCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        // error
        catchError((err) => {
          this.snackbarService.showApiError(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
     * Retrieve Case classification color accordingly to Case's Classification value
     * @param item
     */
  getCaseClassificationColor(item: CaseModel) {
    const classificationData = _.get(this.caseClassificationsListMap, item.classification);
    return _.get(classificationData, 'colorCode', '');
  }

  /**
     * Restore a case that was deleted
     * @param {CaseModel} caseModel
     */
  restoreCase(caseModel: CaseModel) {
    // show confirm dialog to confirm the action
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CASE', new CaseModel(caseModel))
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.caseDataService
            .restoreCase(this.selectedOutbreak.id, caseModel.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Convert a case to contact
     * @param caseModel
     */
  convertCaseToContact(caseModel: CaseModel) {
    // show confirm dialog to confirm the action
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_CONVERT_CASE_TO_CONTACT', new CaseModel(caseModel))
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.caseDataService
            .convertToContact(this.selectedOutbreak.id, caseModel.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE');
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Filter by Classification field
     * @param values
     */
  filterByClassificationField(values) {
    // create condition
    const condition = {classification: {inq: values}};

    // remove existing filter
    this.queryBuilder.filter.removeExactCondition(condition);

    // add new filter
    this.filterBySelectField('classification', values, 'value', false);
  }

  /**
     * Export selected records
     */
  exportSelectedCases() {
    // get list of selected ids
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
      message: 'LNG_PAGE_LIST_CASES_EXPORT_TITLE',
      url: this.exportCasesUrl,
      fileName: '...', // this.casesDataExportFileName,

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },
      extraDialogFields: [
        new DialogField({
          name: 'includeContactFields',
          placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION',
          description: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
          fieldType: DialogFieldType.BOOLEAN
        })
      ],

      // optional
      // allowedExportTypes: this.allowedExportTypes,
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      displayUseQuestionVariable: true,
      // anonymizeFields: this.anonymizeFields,
      // fieldsGroupList: this.fieldsGroupList,
      // fieldsGroupListRequired: this.fieldsGroupListRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }

  /**
     * Export relationship for selected cases
     */
  exportSelectedCasesRelationships() {
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
      EntityType.CASE
    );

    // id
    personsQb.filter.bySelect('id', selectedRecords, true, null);

    // type
    personsQb.filter.byEquality(
      'type',
      EntityType.CASE
    );

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant('LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIP_FILE_NAME'),

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
      // allowedExportTypes: this.allowedExportTypes,
      // anonymizeFields: this.relationshipAnonymizeFields,
      // fieldsGroupList: this.fieldsGroupListRelationships,
      // fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }

  /**
     * Export case investigation form for a Case
     */
  exportCaseInvestigationForm(caseModel: CaseModel) {
    // display export only if we have a selected outbreak
    if (this.selectedOutbreak) {
      // display export dialog
      this.dialogService.showExportDialog({
        message: 'LNG_PAGE_LIST_CASES_EXPORT_CASE_INVESTIGATION_FORM_TITLE',
        url: `outbreaks/${this.selectedOutbreak.id}/cases/${caseModel.id}/export-empty-case-investigation`,
        fileName: '...', // this.casesDataExportFileName,
        fileType: ExportDataExtension.ZIP,
        exportStart: () => { this.showLoadingDialog(); },
        exportFinished: () => { this.closeLoadingDialog(); }
      });
    }
  }

  /**
     * Export cases dossier
     */
  exportSelectedCasesDossier() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // display export only if we have a selected outbreak
    if (this.selectedOutbreak) {
      // remove id from list
      // const anonymizeFields = _.filter(this.anonymizeFields, (value: LabelValuePair) => {
      //   return value.value !== 'id';
      // });

      // display export dialog
      this.dialogService.showExportDialog({
        message: 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_DOSSIER_DIALOG_TITLE',
        url: `outbreaks/${this.selectedOutbreak.id}/cases/dossier`,
        fileName: '...', // this.casesDataExportFileName,
        fileType: ExportDataExtension.ZIP,
        displayAnonymize: true,
        // anonymizeFields: anonymizeFields,
        anonymizeFieldsKey: 'data',
        extraAPIData: {
          cases: selectedRecords
        },
        isPOST: true,
        exportStart: () => { this.showLoadingDialog(); },
        exportFinished: () => { this.closeLoadingDialog(); }
      });
    }
  }

  /**
     * Display contacts popup
     */
  displayContacts(entity: CaseModel) {
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
  displayExposures(entity: CaseModel) {
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
     * Redirect to import relationship page
     */
  goToRelationshipImportPage() {
    this.router.navigate(['/import-export-data', 'relationships', 'import'], {
      queryParams: {
        from: Constants.APP_PAGE.CASES.value
      }
    });
  }
}
