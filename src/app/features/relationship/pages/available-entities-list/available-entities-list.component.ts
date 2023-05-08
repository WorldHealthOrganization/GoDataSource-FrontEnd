import { Component, OnDestroy } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ActivatedRoute } from '@angular/router';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import * as _ from 'lodash';
import { EntityType } from '../../../../core/models/entity-type';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { Constants } from '../../../../core/models/constants';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { of } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-available-entities-list',
  templateUrl: './available-entities-list.component.html'
})
export class AvailableEntitiesListComponent extends ListComponent<CaseModel | ContactModel | EventModel | ContactOfContactModel> implements OnDestroy {
  // route
  private _relationshipType: RelationshipType;

  // entity
  private _entity: CaseModel | ContactModel | EventModel;

  // selected records
  private _selectedRecords: string[];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected activatedRoute: ActivatedRoute,
    protected relationshipDataService: RelationshipDataService,
    protected genericDataService: GenericDataService,
    protected i18nService: I18nService,
    protected locationDataService: LocationDataService,
    protected entityHelperService: EntityHelperService
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true
      }
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve data from snapshot
    this._relationshipType = this.activatedRoute.snapshot.data.relationshipType;
    this._entity = this.activatedRoute.snapshot.data.entity;
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // initialize query builder
    this.clearQueryBuilder();

    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {}

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        sortable: true,
        pinned: IV2ColumnPinned.LEFT,
        format: {
          type: (item: CaseModel | ContactModel | EventModel | ContactOfContactModel): string => {
            return item.type === EntityType.EVENT ? item.name : item.lastName;
          }
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        sortable: true,
        pinned: IV2ColumnPinned.LEFT,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
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
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: this.activatedRoute.snapshot.data.personType.list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          }
        ],
        forms: (_column, data): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // person type
          if (
            data.type &&
            this.activatedRoute.snapshot.data.personType.map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: this.activatedRoute.snapshot.data.personType.map[data.type].getColorCode(),
              tooltip: this.i18nService.instant(data.type)
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'hasDuplicate',
        label: 'LNG_PAGE_LIST_AVAILABLE_ENTITIES_HAS_POSSIBLE_RELATIONSHIP_DUPLICATE',
        format: {
          type: V2ColumnFormat.BOOLEAN,
          value: (item) => item.matchedDuplicateRelationships?.length > 0
        }
      },
      {
        field: 'age',
        label: 'LNG_ENTITY_FIELD_LABEL_AGE',
        sortable: true,
        format: {
          type: V2ColumnFormat.AGE
        },
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
        }
      },
      {
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'riskLevel',
        label: 'LNG_ENTITY_FIELD_LABEL_RISK',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'classification',
        label: 'LNG_ENTITY_FIELD_LABEL_CLASSIFICATION',
        format: {
          type: (item) => item.classification ?
            this.i18nService.instant(item.classification) :
            ''
        },
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'place',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        link: (data) => {
          return data.mainAddress?.location?.name ?
            `/locations/${ data.mainAddress.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'fullAddress',
        label: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        format: {
          type: 'mainAddress.fullAddress'
        }
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {
    // update selected
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'updateSelected',
        process: (
          _dataMap,
          selected
        ) => {
          // update selected
          this._selectedRecords = selected;
        }
      }
    ];
  }

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
  protected initializeGroupActions(): void {
    // trick to display checkboxes
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => true,
      actions: [
        {
          visible: () => false
        }
      ]
    };
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_SELECT',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => [
          '/relationships',
          this._entity.type,
          this._entity.id,
          this._relationshipType === RelationshipType.CONTACT ?
            'contacts' :
            'exposures',
          'create'
        ],
        linkQueryParams: () => ({
          selectedEntityIds: this._selectedRecords?.length > 0 ?
            JSON.stringify(this._selectedRecords) :
            undefined
        })
      },
      disable: () => {
        return !this._selectedRecords?.length;
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

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
            ['/account/my-profile']
        }
      }, {
        label: this.entityHelperService.entityMap[this._entity.type].label,
        action: {
          link: [this.entityHelperService.entityMap[this._entity.type].link]
        }
      }, {
        label: this._entity.name,
        action: {
          link: [
            this.entityHelperService.entityMap[this._entity.type].link,
            this._entity.id,
            'view'
          ]
        }
      }, {
        label: this._relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: {
          link: [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this._relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]
        }
      }, {
        label: 'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE',
        action: null
      }
    ];
  }

  /**
   * Clear query builder
   */
  clearQueryBuilder(): void {
    // clear query builder
    this.queryBuilder.clear();

    // retrieve only available entity types
    const availableTypes: EntityType[] = this.genericDataService.getAvailableRelatedEntityTypes(
      this._entity.type,
      this._relationshipType,
      Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_RELATIONSHIPS.value
    );
    this.queryBuilder.filter.where({
      type: {
        'inq': availableTypes
      }
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'type',
      'lastName',
      'firstName',
      'name',
      'visualId',
      'matchedDuplicateRelationships',
      'age',
      'gender',
      'riskLevel',
      'classification',
      'address',
      'addresses'
    ];
  }

  /**
   * Re(load) the Relationships list, based on the applied filter, sort criterias
   */
  refreshList(): void {
    // request data
    this.records$ = this.relationshipDataService
      .getEntityAvailablePeople(
        this.selectedOutbreak.id,
        this._entity.type,
        this._entity.id,
        this.queryBuilder
      )
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            // type ?
            if (item instanceof EventModel) {
              locationsIdsMap[item.address.locationId] = true;
            } else {
              (item.addresses || []).forEach((address) => {
                // nothing to add ?
                if (!address?.locationId) {
                  return;
                }

                // add location to list
                locationsIdsMap[address.locationId] = true;
              });
            }
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
                  // type ?
                  if (item instanceof EventModel) {
                    item.address.location = item.address.locationId && locationsMap[item.address.locationId]
                      ? locationsMap[item.address.locationId]
                      : item.address.location;
                  } else {
                    (item.addresses || []).forEach((address) => {
                      address.location = address.locationId && locationsMap[address.locationId] ?
                        locationsMap[address.locationId] :
                        address.location;
                    });
                  }
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
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
    this.relationshipDataService
      .getEntityAvailablePeopleCount(
        this.selectedOutbreak.id,
        this._entity.type,
        this._entity.id,
        countQueryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}
