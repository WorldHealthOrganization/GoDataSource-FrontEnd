import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { Constants } from '../../../../core/models/constants';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { of } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';

@Component({
  selector: 'app-clusters-people-list',
  templateUrl: './clusters-people-list.component.html'
})
export class ClustersPeopleListComponent extends ListComponent<CaseModel | ContactModel | EventModel | ContactOfContactModel> implements OnDestroy {
  // present cluster
  private _selectedCluster: ClusterModel;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private activatedRoute: ActivatedRoute,
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private locationDataService: LocationDataService,
    private referenceDataHelperService: ReferenceDataHelperService
  ) {
    // parent
    super(
      listHelperService, {
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // get data
    this._selectedCluster = activatedRoute.snapshot.data.selectedCluster;
  }

  /**
   * Release resources
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
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Person
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_ACTION_VIEW',
          action: {
            link: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'view')];
            }
          },
          visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
            return !item.deleted &&
              item.canView(this.authUser);
          }
        },

        // Modify Person
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
          action: {
            link: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'modify')];
            }
          },
          visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              item.canModify(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        sortable: true,
        pinned: IV2ColumnPinned.LEFT,
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
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          includeNoValue: true
        }
      },
      {
        field: 'place',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true,
          search: (column: IV2Column) => {
            // cleanup
            this.queryBuilder.filter.removePathCondition('$or');

            // filter ?
            if (column.filter.address.filterLocationIds?.length > 0) {
              this.queryBuilder.filter.where({
                $or: [
                  {
                    type: EntityType.EVENT,
                    'address.parentLocationIdFilter': {
                      $in: column.filter.address.filterLocationIds
                    }
                  }, {
                    type: {
                      $in: [
                        EntityType.CASE,
                        EntityType.CONTACT,
                        EntityType.CONTACT_OF_CONTACT
                      ]
                    },
                    addresses: {
                      $elemMatch: {
                        typeId: AddressType.CURRENT_ADDRESS,
                        parentLocationIdFilter: {
                          $in: column.filter.address.filterLocationIds
                        }
                      }
                    }
                  }
                ]
              });
            }

            // refresh list
            this.needsRefreshList();
          }
        },
        link: (data) => {
          return data.mainAddress?.location?.name && LocationModel.canView(this.authUser) ?
            `/locations/${ data.mainAddress.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'address',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        format: {
          type: 'mainAddress.addressLine1'
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        pinned: true,
        notResizable: true,
        format: {
          type: V2ColumnFormat.STATUS
        },
        legends: [
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
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
            (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type].getColorCode(),
              tooltip: this.i18nService.instant(data.type)
            });
          } else {
            forms.push({
              type: IV2ColumnStatusFormType.EMPTY
            });
          }

          // finished
          return forms;
        }
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

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
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // add list breadcrumb only if we have permission
    if (ClusterModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CLUSTERS_TITLE',
        action: {
          link: ['/clusters']
        }
      });
    }

    // cluster breadcrumb
    if (
      this._selectedCluster &&
      ClusterModel.canView(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: this._selectedCluster.name,
        action: {
          link: [`/clusters/${ this._selectedCluster.id }/view`]
        }
      });
    }

    // people breadcrumb
    this.breadcrumbs.push(
      {
        label: 'LNG_PAGE_VIEW_CLUSTERS_PEOPLE_TITLE',
        action: null
      });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'firstName',
      'name',
      'age',
      'gender',
      'riskLevel',
      'address',
      'addresses',
      'type',
      'locations'
    ];
  }

  /**
   * Re(load) the Cluster people list, based on the applied filter, sort criterias
   */
  refreshList() {
    this.records$ = this.clusterDataService
      .getClusterPeople(
        this.selectedOutbreak.id,
        this.activatedRoute.snapshot.params.clusterId,
        this.queryBuilder
      )
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            const addresses: AddressModel[] = item instanceof EventModel ?
              [item.address] :
              item.addresses;
            (addresses || []).forEach((address) => {
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
                  const addresses: AddressModel[] = item instanceof EventModel ?
                    [item.address] :
                    item.addresses;
                  (addresses || []).forEach((address) => {
                    address.location = address.locationId && locationsMap[address.locationId] ?
                      locationsMap[address.locationId] :
                      address.location;
                  });
                });

                // finished
                return data;
              })
            );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
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
    countQueryBuilder.clearFields();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.clusterDataService
      .getClusterPeopleCount(
        this.selectedOutbreak.id,
        this.activatedRoute.snapshot.params.clusterId,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
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
   * Get the link to redirect to view page depending on item type and action
   */
  getItemRouterLink(item, action: string): string {
    switch (item.type) {
      case EntityType.CASE:
        return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT:
        return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT_OF_CONTACT:
        return `/contacts-of-contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.EVENT:
        return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
    }
  }
}
