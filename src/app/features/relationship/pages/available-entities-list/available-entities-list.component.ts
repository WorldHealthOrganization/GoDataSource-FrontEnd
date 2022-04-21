import { Component, OnDestroy, OnInit } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { catchError, map, share } from 'rxjs/operators';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { AddressType } from '../../../../core/models/address.model';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
  selector: 'app-available-entities-list',
  templateUrl: './available-entities-list.component.html'
})
export class AvailableEntitiesListComponent extends RelationshipsListComponent implements OnInit, OnDestroy {
  // entities list relationships
  entitiesList$: Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]>;
  entitiesListCount$: Observable<IBasicCount>;

  // available side filters
  availableSideFilters: FilterModel[];

  // saved filters type
  savedFiltersType = Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_RELATIONSHIPS.value;

  // reference data
  genderList$: Observable<any[]>;
  personTypesList$: Observable<any[]>;
  personTypesListMap: { [id: string]: ReferenceDataEntryModel };
  riskLevelsList$: Observable<any[]>;
  caseClassificationsList$: Observable<any[]>;

  // provide constants to template
  Constants = Constants;
  ReferenceDataCategory = ReferenceDataCategory;
  EntityType = EntityType;

  fixedTableColumns: string[] = [
    'checkbox',
    'hasDuplicate',
    'lastName',
    'firstName',
    'visualId',
    'age',
    'gender',
    'riskLevel',
    'classification',
    'place',
    'address'
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    protected router: Router,
    protected route: ActivatedRoute,
    protected outbreakDataService: OutbreakDataService,
    protected entityDataService: EntityDataService,
    private toastV2Service: ToastV2Service,
    private genericDataService: GenericDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private relationshipDataService: RelationshipDataService
  ) {
    super(
      listHelperService, router, route,
      outbreakDataService, entityDataService
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    super.ngOnInit();

    // reference data
    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
    this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());
    this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION).pipe(share());
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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

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
      Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_RELATIONSHIPS.value
    );
    this.queryBuilder.filter.where({
      type: {
        'inq': availableTypes
      }
    });
  }

  // private initializeBreadcrumbs() {
  //   if (
  //     this.relationshipType &&
  //           this.entity
  //   ) {
  //     this.breadcrumbs = [
  //       new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
  //       new BreadcrumbItemModel(
  //         this.entity.name,
  //         `${this.entityMap[this.entityType].link}/${this.entityId}/view`
  //       ),
  //       new BreadcrumbItemModel(
  //         this.relationshipsListPageTitle,
  //         `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
  //       ),
  //       new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE', null, true)
  //     ];
  //   }
  // }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the available Entities list, based on the applied filter, sort criterias
   */
  refreshList() {
    if (
      this.entityType &&
            this.entityId &&
            this.selectedOutbreak
    ) {
      // retrieve location list
      this.queryBuilder.include('locations', true);

      // retrieve the list of Relationships
      this.entitiesList$ = this.relationshipDataService
        .getEntityAvailablePeople(
          this.selectedOutbreak.id,
          this.entityType,
          this.entityId,
          this.queryBuilder
        )
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        );
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
      this.entitiesListCount$ = this.relationshipDataService
        .getEntityAvailablePeopleCount(
          this.selectedOutbreak.id,
          this.entityType,
          this.entityId,
          countQueryBuilder
        )
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  private generateSideFilters() {
    this.availableSideFilters = [
      new FilterModel({
        fieldName: 'type',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_TYPE',
        type: FilterType.MULTISELECT,
        options$: this.personTypesList$,
        sortable: true
      }),
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
        fieldName: 'age',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_AGE',
        type: FilterType.RANGE_AGE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'addresses',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        type: FilterType.ADDRESS,
        addressFieldIsArray: true
      }),
      new FilterModel({
        fieldName: 'dob',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_DOB',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'riskLevel',
        fieldLabel: 'LNG_ENTITY_FIELD_LABEL_RISK',
        type: FilterType.MULTISELECT,
        options$: this.riskLevelsList$,
        sortable: true
      })
    ];
  }

  /**
     * @Overrides parent method
     */
  public sortBy(
    data: any,
    objectDetailsSort?: {
      [property: string]: string[]
    }
  ) {
    const property = _.get(data, 'active');
    const direction = _.get(data, 'direction');

    if (
      property === 'firstName' &&
            direction
    ) {
      // need to sort by firstName ASC, name ASC (so we sort Events aswell)

      // remove previous sort columns, we can sort only by one column at a time
      this.queryBuilder.sort.clear();

      // retrieve Side filters
      // let queryBuilder;
      // if (
      //   this.sideFilter &&
      //   (queryBuilder = this.sideFilter.getQueryBuilder())
      // ) {
      //   this.queryBuilder.sort.merge(queryBuilder.sort);
      // }

      // apply sort
      this.queryBuilder.sort.by('firstName', direction);
      this.queryBuilder.sort.by('name', direction);

      // refresh list
      this.needsRefreshList(false, false);
    } else {
      // call method from parent class
      super.sortBy(data, objectDetailsSort);
    }
  }

  /**
     * Retrieve Person Type color
     */
  getPersonTypeColor(personType: string) {
    const personTypeData = _.get(this.personTypesListMap, personType);
    return _.get(personTypeData, 'colorCode', '');
  }

  selectEntities() {
    // // get list of selected ids
    // const selectedRecords: false | string[] = this.validateCheckedRecords();
    // if (!selectedRecords) {
    //   return;
    // }
    //
    // // redirect to next step
    // this.router.navigate(
    //   [`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/create`],
    //   {
    //     queryParams: {
    //       selectedEntityIds: JSON.stringify(selectedRecords)
    //     }
    //   }
    // );
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
