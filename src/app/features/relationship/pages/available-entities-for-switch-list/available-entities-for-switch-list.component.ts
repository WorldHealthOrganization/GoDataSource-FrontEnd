import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable, throwError } from 'rxjs/index';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { catchError, map, share, tap } from 'rxjs/internal/operators';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityType } from '../../../../core/models/entity-type';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { AddressType } from '../../../../core/models/address.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
  selector: 'app-available-entities-for-switch-list',
  templateUrl: './available-entities-for-switch-list.component.html'
})
export class AvailableEntitiesForSwitchListComponent extends RelationshipsListComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItemModel[] = [];

  entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;
  entitiesListCount$: Observable<IBasicCount>;
  entityType: EntityType;

  // available side filters
  availableSideFilters: FilterModel[];
  selectedRecordsIds: string[];
  selectedPeopleIds: string[];

  // saved filters type
  savedFiltersType = Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_SWITCH.value;

  // reference data
  genderList$: Observable<any[]>;
  personTypesList$: Observable<any[]>;
  personTypesListMap: { [id: string]: ReferenceDataEntryModel };

  // provide constants to template
  Constants = Constants;
  ReferenceDataCategory = ReferenceDataCategory;
  EntityType = EntityType;

  fixedTableColumns: string[] = [
    'radio',
    'lastName',
    'firstName',
    'visualId',
    'gender',
    'place'
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    protected router: Router,
    protected route: ActivatedRoute,
    protected authDataService: AuthDataService,
    protected outbreakDataService: OutbreakDataService,
    protected entityDataService: EntityDataService,
    private snackbarService: SnackbarService,
    private relationshipDataService: RelationshipDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private genericDataService: GenericDataService
  ) {
    // parent
    super(
      listHelperService, router, route,
      authDataService, outbreakDataService, entityDataService
    );

    // disable multi select for current list component
    this.checkedIsMultiSelect = false;
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    super.ngOnInit();

    // reference data
    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
    const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
    this.personTypesList$ = personTypes$
      .pipe(
        map((data: ReferenceDataCategoryModel) => {
          return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
            new LabelValuePair(entry.value, entry.id)
          );
        })
      );
    personTypes$.subscribe((personTypeCategory: ReferenceDataCategoryModel) => {
      this.personTypesListMap = _.transform(
        personTypeCategory.entries,
        (result, entry: ReferenceDataEntryModel) => {
          // groupBy won't work here since groupBy will put an array instead of one value
          result[entry.id] = entry;
        },
        {}
      );
    });

    // side filters
    this.generateSideFilters();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
     * @Overrides parent method
     */
  onDataInitialized() {
    // initialize breadcrumbs
    this.initializeBreadcrumbs();

    // initialize query builder
    this.clearQueryBuilder();

    // initialize pagination
    this.initPaginator();
    // ...and (re)load the list
    this.needsRefreshList(true);
  }

  /**
     * Get queryParams for further use
     */
  getQueryParams() {
    // read route query params
    if (_.isEmpty(this.route.snapshot.queryParams.selectedTargetIds)) {
      this.snackbarService.showError('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_NO_CONTACTS_SELECTED');
      this.router.navigate(['/contacts/follow-ups']);
    } else {
      this.selectedRecordsIds = JSON.parse(this.route.snapshot.queryParams.selectedTargetIds);
      this.selectedPeopleIds = JSON.parse(this.route.snapshot.queryParams.selectedPersonsIds);
      this.entityType = JSON.parse(this.route.snapshot.queryParams.entityType);
    }
  }

  /**
     * @Overrides parent method
     */
  onPersonLoaded() {
    // (re)initialize breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * @Overrides parent method
     */
  clearQueryBuilder() {
    // clear query builder
    this.queryBuilder.clear();
    // retrieve only available entity types
    const availableTypes: EntityType[] = this.genericDataService.getAvailableRelatedEntityTypes(
      this.entityType,
      this.relationshipType,
      Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_SWITCH.value
    );
    this.queryBuilder.filter.where({
      type: {
        'inq': availableTypes
      }
    });
  }

  private initializeBreadcrumbs() {
    if (
      this.relationshipType &&
            this.entity
    ) {
      this.breadcrumbs = [
        new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
        new BreadcrumbItemModel(
          this.entity.name,
          `${this.entityMap[this.entityType].link}/${this.entityId}/view`
        ),
        new BreadcrumbItemModel(
          this.relationshipsListPageTitle,
          `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
        ),
        new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_TITLE', null, true)
      ];
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the available Entities list, based on the applied filter, sort criterias
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (
      this.entityType &&
            this.entityId &&
            this.selectedOutbreak
    ) {
      this.getQueryParams();
      // create queryBuilder
      const qb = new RequestQueryBuilder();
      qb.merge(this.queryBuilder);

      qb.filter.where({
        id: {
          nin: this.selectedPeopleIds
        }
      });

      // retrieve location list
      qb.include('locations', true);

      // retrieve the list of Relationships
      this.entitiesList$ = this.relationshipDataService
        .getEntityAvailablePeople(
          this.selectedOutbreak.id,
          this.entityType,
          this.entityId,
          qb
        )
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
    if (
      this.entityType &&
            this.entityId &&
            this.selectedOutbreak
    ) {
      // set apply value
      if (applyHasMoreLimit !== undefined) {
        this.applyHasMoreLimit = applyHasMoreLimit;
      }

      // get ...
      this.getQueryParams();

      // create queryBuilder
      const qb = new RequestQueryBuilder();
      qb.merge(this.queryBuilder);
      qb.paginator.clear();
      qb.filter.where({
        id: {
          nin: this.selectedPeopleIds
        }
      });

      // apply has more limit
      if (this.applyHasMoreLimit) {
        qb.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.entitiesListCount$ = this.relationshipDataService
        .getEntityAvailablePeopleCount(
          this.selectedOutbreak.id,
          this.entityType,
          this.entityId,
          qb
        )
        .pipe(
          catchError((err) => {
            this.snackbarService.showApiError(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  private generateSideFilters() {
    this.availableSideFilters = [
      new FilterModel({
        fieldName: 'firstName',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'lastName',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'visualId',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        type: FilterType.TEXT
      }),
      new FilterModel({
        fieldName: 'gender',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        type: FilterType.MULTISELECT,
        options$: this.genderList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        type: FilterType.ADDRESS,
        addressFieldIsArray: true
      })
    ];
  }

  /**
     * Retrieve Person Type color
     */
  getPersonTypeColor(personType: string) {
    const personTypeData = _.get(this.personTypesListMap, personType);
    return _.get(personTypeData, 'colorCode', '');
  }

  /**
     * Switch cases with selected entity
     */
  switchWithSelectedRecord() {
    // get the selected record
    const selectedRecordId = this.checkedRecords[0];
    if (!selectedRecordId) {
      return;
    }

    // create query builder for relationships
    const qb = new RequestQueryBuilder();

    // filter
    qb.filter.where({
      id: {
        inq: this.selectedRecordsIds
      }
    });

    // display loading
    const loadingDialog = this.dialogService.showLoadingDialog();
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_CHANGE_SOURCE')
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.relationshipDataService
            .bulkChangeSource(
              this.selectedOutbreak.id,
              selectedRecordId,
              qb
            )
            .pipe(
              catchError((err) => {
                // hide dialog
                loadingDialog.close();

                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // hide dialog
              loadingDialog.close();

              // saved
              this.snackbarService.showSuccess('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_ACTION_SET_SOURCE_SUCCESS_MESSAGE');

              // redirect
              this.router.navigate(['/relationships', this.entityType, selectedRecordId, 'contacts']);
            });
        } else {
          // hide dialog
          loadingDialog.close();
        }
      });
  }

  /**
     * Filter by locations selected in location-drop-down
     * @param locations
     */
  filterByLocation(locations) {
    // remove previous condition
    this.queryBuilder.filter.remove('addresses');
    if (!_.isEmpty(locations)) {
      // mapping all the locations to get the ids
      const locationsIds = _.map(locations, (location) => {
        return location.id;
      });

      // build query
      this.queryBuilder.filter.where({
        addresses: {
          elemMatch: {
            typeId: AddressType.CURRENT_ADDRESS,
            parentLocationIdFilter: {
              $in: locationsIds
            }
          }
        }
      });
    }

    // refresh list
    this.needsRefreshList();
  }
}
