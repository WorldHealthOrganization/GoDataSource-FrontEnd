import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { TeamModel } from '../../../../core/models/team.model';
import { map, takeUntil, tap } from 'rxjs/operators';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { Location } from '@angular/common';
import { V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { SavedFilterData, SavedFilterDataAppliedFilter } from '../../../../core/models/saved-filters.model';
import { RequestFilterOperator } from '../../../../core/helperClasses/request-query-builder';
import { IV2DateRange } from '../../../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';

@Component({
  selector: 'app-team-workload',
  templateUrl: './team-workload.component.html'
})
export class TeamWorkloadComponent extends ListComponent<any> implements OnDestroy {
  // default table columns
  defaultTableColumns: IV2Column[] = [
    {
      field: 'team',
      label: 'LNG_PAGE_TEAMS_WORKLOAD_TEAM_LABEL',
      pinned: IV2ColumnPinned.LEFT,
      notMovable: true,
      format: {
        type: 'team.name'
      },
      link: (data) => {
        return TeamModel.canView(this.authUser) && this.activatedRoute.snapshot.data.team.map[data.team.id] ?
          `/teams/${ data.team.id }/view` :
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
      listHelperService,
      true
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
            uniqueKey: 'dateLNG_PAGE_TEAMS_WORKLOAD_DATE_LABEL'
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
      'LNG_PAGE_TEAMS_WORKLOAD_NO_DATA_LABEL'
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
        label: 'LNG_PAGE_TEAMS_WORKLOAD_DATE_LABEL'
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
    if (TeamModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_TEAMS_TITLE',
        action: {
          link: ['/teams']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_TEAMS_WORKLOAD_TITLE',
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
    // retrieve the list of Follow Ups
    this.records$ = this.followUpsDataService
      .getFollowUpsPerDayTeam(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        // process data
        map((metricTeamsFollowups) => {
          // Move "No team" to top
          metricTeamsFollowups.teams.sort((a) => a.id ? 0 : -1);

          // determine date ranges
          let minDate: Moment;
          let maxDate: Moment;

          // transform to list
          const usedDates: {
            [date: string]: true
          } = {};

          // group by team
          const followUpsGroupedByTeam: {
            team: TeamModel,
            followUpsPerDay: {
              [date: string]: {
                date: string | Moment,
                contactIDs: string[],
                totalFollowupsCount: number,
                successfulFollowupsCount: number
              }
            }
          }[] = (metricTeamsFollowups.teams || []).map((team) => {
            // get grouped followups by team
            return {
              team: this.activatedRoute.snapshot.data.team.map[team.id] ??
                {
                  name: this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_NO_TEAM_LABEL')
                },
              followUpsPerDay: _.keyBy(team.dates, (entry) => {
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
                      team: TeamModel,
                      followUpsPerDay: {
                        date: string | Moment,
                        contactIDs: string[],
                        totalFollowupsCount: number,
                        successfulFollowupsCount: number
                      } },
                    column
                  ) => {
                    // nothing to do here ?
                    const followUpsPerDay = data.followUpsPerDay[column.field];
                    if (!followUpsPerDay) {
                      return '';
                    }

                    // construct url
                    const url: string = `/contacts/follow-ups?fromWorkload=true&date=${ moment(followUpsPerDay.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) }&team=${ data.team && data.team.id ? data.team.id : '' }`;

                    // status for successful followups
                    const status: string = '&status=' + encodeURIComponent(JSON.stringify([
                      'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_SEEN_OK',
                      'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_SEEN_NOT_OK'
                    ]));

                    // render html
                    const   html: string =
                      `<a class="gd-list-table-link" href="${ this.location.prepareExternalUrl(url + status) }">
                        <span is-link="${ url + status }">
                          ${ followUpsPerDay.successfulFollowupsCount }
                        </span>
                      </a>
                      ${ this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_TABLE_OF_LABEL') }
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
          return followUpsGroupedByTeam;
        }),

        // set count
        tap((followUpsGroupedByTeam: []) => {
          this.pageCount = {
            count: followUpsGroupedByTeam.length,
            hasMore: false
          };
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(): void {}
}
