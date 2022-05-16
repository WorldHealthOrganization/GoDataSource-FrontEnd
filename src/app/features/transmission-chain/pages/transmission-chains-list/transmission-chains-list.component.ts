import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ApplyListFilter } from '../../../../core/models/constants';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { TransmissionChainGroupModel, TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-transmission-chains-list',
  templateUrl: './transmission-chains-list.component.html'
})
export class TransmissionChainsListComponent extends ListComponent<TransmissionChainModel> implements OnDestroy {
  queryParamsData: any;

  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private transmissionChainDataService: TransmissionChainDataService,
    private route: ActivatedRoute,
    private i18nService: I18nService
  ) {
    super(listHelperService);

    // get query params
    this.queryParamsData = this.route.snapshot.queryParams;
    this.appliedListFilter = this.queryParamsData.applyListFilter;

    // init filters
    this.resetFiltersAddDefault();
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
  * Component destroyed
  */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
  * Initialize Side Table Columns
  */
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'earliestDateOfOnset',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_EARLIEST_DATE_OF_ONSET',
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        // TODO: Redirect link needs parameters left in template
        field: 'rootPerson.name',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_ROOT_CASE',
        link: () => {
          return TransmissionChainModel.canViewAnyGraph(this.authUser) ? '/transmission-chains' : '';
        }
      },
      {
        field: 'size',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_NO_CASES'
      },
      {
        field: 'noAliveCases',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_NO_CASES_ALIVE'
      },
      {
        field: 'contactsCount',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_NUMBER_OF_CONTACTS'
      },
      {
        field: 'duration',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_DURATION',
        format: {
          type: (item) => {
            const days = ' ' + this.i18nService.instant('LNG_PAGE_LIST_TRANSMISSION_CHAINS_LABEL_DURATION_DAYS');
            return item && item.duration ? item.duration + days : 0 + days;
          }
        }
      },
      {
        field: 'active',
        label: 'LNG_TRANSMISSION_CHAIN_FIELD_LABEL_ACTIVE',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      }
    ];
  }

  /**
  * Initialize process data
  */
  protected initializeProcessSelectedData(): void { }

  /**
  * Initialize table infos
  */
  protected initializeTableInfos(): void { }

  /**
  * Initialize Table Advanced Filters
  */
  protected initializeTableAdvancedFilters(): void { }

  /**
  * Initialize table quick actions
  */
  protected initializeQuickActions(): void { }

  /**
  * Initialize table group actions
  */
  protected initializeGroupActions(): void { }

  /**
  * Initialize table add action
  */
  protected initializeAddAction(): void { }

  /**
  * Initialize table grouped data
  */
  protected initializeGroupedData(): void { }

  /**
  * Initialize filters
  */
  resetFiltersAddDefault() {
    // get global filter values
    if (this.queryParamsData) {
      // get global filters
      const globalFilters = this.getGlobalFilterValues(this.queryParamsData);

      // generate query builder
      let qb: RequestQueryBuilder;
      switch (this.appliedListFilter) {
        case ApplyListFilter.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
          // NOTHING - IGNORE
          break;

        case ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
          // date
          qb = new RequestQueryBuilder();

          // date
          if (globalFilters.date) {
            qb.filter.byDateRange(
              'contactDate', {
                endDate: globalFilters.date.endOf('day').toISOString()
              }
            );
          }

          // location
          if (globalFilters.locationId) {
            qb.addChildQueryBuilder('case').filter
              .byEquality('addresses.parentLocationIdFilter', globalFilters.locationId);
          }

          // classification
          if (!_.isEmpty(globalFilters.classificationId)) {
            // person
            qb.addChildQueryBuilder('case').filter.where({
              classification: {
                inq: globalFilters.classificationId
              }
            });
          }

          // finished
          break;

        default:
          // date
          qb = new RequestQueryBuilder();

          // date
          if (globalFilters.date) {
            qb.filter.byDateRange(
              'contactDate', {
                endDate: globalFilters.date.endOf('day').toISOString()
              }
            );
          }

          // location
          if (globalFilters.locationId) {
            qb.addChildQueryBuilder('person').filter.where({
              or: [
                {
                  type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                  'address.parentLocationIdFilter': globalFilters.locationId
                }, {
                  type: {
                    inq: [
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                    ]
                  },
                  'addresses.parentLocationIdFilter': globalFilters.locationId
                }
              ]
            });
          }

          // classification
          if (!_.isEmpty(globalFilters.classificationId)) {
            // define classification conditions
            const classificationConditions = {
              or: [
                {
                  type: {
                    neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                  }
                }, {
                  type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                  classification: {
                    inq: globalFilters.classificationId
                  }
                }
              ]
            };

            // top level classification
            qb.filter.where(classificationConditions);

            // person
            qb.addChildQueryBuilder('person').filter.where(classificationConditions);
          }
      }

      // merge
      if (qb) {
        this.queryBuilder.merge(qb);
      }
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
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE',
        action: null
      }
    ];
  }

  /**
  * Fields retrieved from api to reduce payload size
  */
  protected refreshListFields(): string[] {
    return [
      // edges
      'edges.id',
      'edges.persons',
      'edges.contactDate',

      // nodes
      'nodes.id',
      'nodes.type',
      'nodes.date',
      'nodes.dateOfOnset',
      'nodes.name',
      'nodes.firstName',
      'nodes.middleName',
      'nodes.lastName'
    ];
  }

  /**
  * Re(load) the Transmission Chains list, based on the applied filter, sort criterias
  */
  refreshList() {
    // retrieve only specific fields so we don't retrieve huge amounts of data that won't be used since we don't have pagination here
    const qb = new RequestQueryBuilder();
    qb.merge(this.queryBuilder);

    // construct request
    let transmissionChains$: Observable<TransmissionChainGroupModel>;
    if (this.appliedListFilter === ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES) {
      transmissionChains$ = this.transmissionChainDataService
        .getTransmissionChainsFromContactsWhoBecameCasesList(
          this.selectedOutbreak.id,
          qb
        );
    } else {
      // attach extra filter conditions
      qb.filter.flag(
        'countContacts',
        true
      );

      // request
      transmissionChains$ = this.transmissionChainDataService
        .getIndependentTransmissionChainData(
          this.selectedOutbreak.id,
          qb
        );
    }

    // execute request
    this.records$ = transmissionChains$
      .pipe(
        map((data: TransmissionChainGroupModel) => {
          // list of items
          this.pageCount = {
            count: data.chains.length,
            hasMore: false
          };
          // display only items from this page
          if (this.queryBuilder.paginator) {
            data.chains = data.chains.slice(
              this.queryBuilder.paginator.skip,
              this.queryBuilder.paginator.skip + this.queryBuilder.paginator.limit
            );
          }


          return data.chains;
        })
      );
  }

  /**
  * Get total number of items
  */
  refreshListCount() {}
}