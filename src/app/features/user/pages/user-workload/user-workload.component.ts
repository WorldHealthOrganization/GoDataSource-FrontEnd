import { Component, OnDestroy } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { UserModel } from '../../../../core/models/user.model';
import { map, takeUntil, tap } from 'rxjs/operators';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ActivatedRoute } from '@angular/router';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { Location } from '@angular/common';
import { IV2DateRange } from '../../../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';
import { SavedFilterData, SavedFilterDataAppliedFilter } from '../../../../core/models/saved-filters.model';
import { RequestFilterOperator } from '../../../../core/helperClasses/request-query-builder';

@Component({
  selector: 'app-user-workload',
  templateUrl: './user-workload.component.html'
})
export class UserWorkloadComponent extends ListComponent<any, IV2Column> implements OnDestroy {
  // default table columns
  defaultTableColumns: IV2Column[] = [
    {
      field: 'user',
      label: 'LNG_PAGE_USERS_WORKLOAD_USER_LABEL',
      pinned: IV2ColumnPinned.LEFT,
      notMovable: true,
      format: {
        type: 'user.name'
      },
      link: (data) => {
        return UserModel.canView(this.authUser) && this.activatedRoute.snapshot.data.user.map[data.user.id] ?
          `/users/${ data.user.id }/view` :
          undefined;
      }
    }
  ];

  // advanced filters config
  advancedFiltersConfig: {
    operatorHide?: boolean,
    disableAdd?: boolean,
    disableReset?: boolean,
    disableDelete?: boolean
  } = {
      operatorHide: true,
      disableAdd: true,
      disableReset: true,
      disableDelete: true
    };

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private followUpsDataService: FollowUpsDataService,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {
    super(
      listHelperService, {
        disableFilterCaching: true
      }
    );
  }

  /**
   * Remove component resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // set default advanced filters
    const defaultFilter: IV2DateRange = {
      startDate: moment(Constants.getCurrentDate().subtract(28, 'days')).startOf('day'),
      endDate: moment(Constants.getCurrentDate()).endOf('day')
    };
    this.tableV2Component.generateFiltersFromFilterData(new SavedFilterData({
      appliedFilterOperator: RequestFilterOperator.AND,
      appliedFilters: [
        // date
        new SavedFilterDataAppliedFilter({
          filter: {
            uniqueKey: 'dateLNG_PAGE_USERS_WORKLOAD_DATE_LABEL'
          },
          comparator: V2AdvancedFilterComparatorType.BETWEEN,
          value: defaultFilter
        })
      ]
    }));

    // filter by default range
    this.queryBuilder.filter.byDateRange(
      'date',
      defaultFilter
    );

    // initialize pagination
    // this page doesn't have pagination

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
  protected initializeTableColumns(): void {}

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {
    this.infos = [
      'LNG_PAGE_USERS_WORKLOAD_NO_DATA_LABEL'
    ];
  }

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = [
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_PAGE_USERS_WORKLOAD_DATE_LABEL'
      }
    ];
  }

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
  initializeBreadcrumbs(): void {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // list page
    if (UserModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_USERS_TITLE',
        action: {
          link: ['/users']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_USERS_WORKLOAD_TITLE',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
  * Refresh list
  */
  refreshList() {
    // retrieve the list of Follow-Ups
    this.records$ = this.followUpsDataService
      .getFollowUpsPerDayUser(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        // process data
        map((metricUsersFollowups) => {
          // Move "No user" to top
          metricUsersFollowups.users.sort((a) => a.id ? 0 : -1);

          // determine date ranges
          let minDate: Moment;
          let maxDate: Moment;

          // transform to list
          const usedDates: {
            [date: string]: true
          } = {};

          // group by user
          const followUpsGroupedByUser: {
            user: UserModel,
            followUpsPerDay: {
              [date: string]: {
                date: string | Moment,
                contactIDs: string[],
                totalFollowupsCount: number,
                successfulFollowupsCount: number
              }
            }
          }[] = (metricUsersFollowups.users || []).map((user) => {
            // get grouped followups by user
            return {
              user: this.activatedRoute.snapshot.data.user.map[user.id] ??
              {
                name: this.i18nService.instant('LNG_PAGE_USERS_WORKLOAD_NO_USER_LABEL')
              },
              followUpsPerDay: _.keyBy(user.dates, (entry) => {
                // determine min & max dates
                const date = moment(entry.date).startOf('day');
                minDate = minDate ?
                  (date.isBefore(minDate) ? date : minDate) :
                  date;
                maxDate = maxDate ?
                  (date.isAfter(maxDate) ? moment(date) : maxDate) :
                  moment(date);

                // mark date found
                usedDates[date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)] = true;

                // set keys to dates
                return [date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)];
              })
            };
          });

          // create dates array
          const daysColumns: IV2Column[] = [];
          if (
            minDate &&
            maxDate
          ) {
            // push dates
            while (minDate.isSameOrBefore(maxDate)) {
              // - exclude dates with no data
              const formattedDate = minDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
              if (usedDates[formattedDate]) {
                daysColumns.push({
                  field: formattedDate,
                  label: formattedDate,
                  notMovable: true,
                  format: {
                    type: V2ColumnFormat.HTML
                  },
                  html: (
                    data: {
                      user: UserModel,
                      followUpsPerDay: {
                        date: string | Moment,
                        contactIDs: string[],
                        totalFollowupsCount: number,
                        successfulFollowupsCount: number
                      }
                    },
                    column
                  ) => {
                    // nothing to do here ?
                    const followUpsPerDay = data.followUpsPerDay[column.field];
                    if (!followUpsPerDay) {
                      return '';
                    }

                    // construct url
                    const url: string = `/contacts/follow-ups?fromWorkload=true&date=${ moment(followUpsPerDay.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) }&user=${ data.user && data.user.id ? data.user.id : '' }`;

                    // status for successful followups
                    const status: string = '&status=' + encodeURIComponent(JSON.stringify([
                      'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_SEEN_OK',
                      'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_SEEN_NOT_OK'
                    ]));

                    // render html
                    const html: string =
                      `<a class="gd-list-table-link" href="${ this.location.prepareExternalUrl(url + status) }">
                        <span is-link="${ url + status }">
                          ${ followUpsPerDay.successfulFollowupsCount }
                        </span>
                      </a>
                      ${ this.i18nService.instant('LNG_PAGE_USERS_WORKLOAD_TABLE_OF_LABEL') }
                      <a class="gd-list-table-link" href="${ this.location.prepareExternalUrl(url) }" >
                        <span is-link="${ url }">
                          ${ followUpsPerDay.totalFollowupsCount }
                        </span>
                      </a>`;

                    // finished
                    return html;
                  }
                });
              }

              // next day
              minDate.add('1', 'days');
            }
          }

          // update table columns
          this.tableColumns = [
            ...this.defaultTableColumns,
            ...daysColumns
          ];

          // finished
          return followUpsGroupedByUser;
        }),

        // set count
        tap((followUpsGroupedByUser: []) => {
          this.pageCount = {
            count: followUpsGroupedByUser.length,
            hasMore: false
          };
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
