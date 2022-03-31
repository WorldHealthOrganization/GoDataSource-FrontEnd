import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TeamFollowupsPerDayModel } from '../../../../core/models/team-followups-per-day.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import * as _ from 'lodash';
import { FormDateRangeSliderData } from '../../../../shared/xt-forms/components/form-date-range-slider/form-date-range-slider.component';
import { Subscription } from 'rxjs';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { TeamModel } from '../../../../core/models/team.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

interface ITeamMap {
  id: string;
  dates: {};
  name: string;
}

@Component({
  selector: 'app-team-workload',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './team-workload.component.html',
  styleUrls: ['./team-workload.component.less']
})
export class TeamWorkloadComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  dates: string[] = [];
  teamsDataShow: ITeamMap[] = [];
  teamsData: ITeamMap[];

  // loading flag - display spinner instead of table
  displayLoading: boolean = false;

  // Filter slider data
  slideFilterData: {
    minDate: Moment,
    maxDate: Moment,
    maxRange: number
  } = {
      minDate: moment().startOf('day'),
      maxDate: moment().endOf('day'),
      maxRange: 0
    };

  // Slider Date Filter Value
  sliderDateFilterValue: FormDateRangeSliderData;

  getSelectedOutbreakSubject: Subscription;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private followUpsDataService: FollowUpsDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private teamDataService: TeamDataService
  ) {
    super(
      listHelperService,
      true
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get teams
    this.displayLoading = true;
    this.teamDataService
      .getTeamsList()
      .subscribe((teams) => {
        // map teams
        this.teamsData = [{
          id: null,
          name: this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_NO_TEAM_LABEL'),
          dates: {}
        }];
        _.forEach(teams, (team: TeamModel) => {
          this.teamsData.push({
            id: team.id,
            name: team.name,
            dates: {}
          });
        });

        // retrieve outbreak data
        this.getSelectedOutbreakSubject = this.outbreakDataService
          .getSelectedOutbreakSubject()
          .subscribe((selectedOutbreak: OutbreakModel) => {
            // selected outbreak
            this.selectedOutbreak = selectedOutbreak;
            if (
              this.selectedOutbreak &&
                            this.selectedOutbreak.id
            ) {
              // set min & max dates
              this.slideFilterData.minDate = moment(this.selectedOutbreak.startDate).startOf('day');
              this.slideFilterData.maxDate = moment().add(1, 'days').endOf('day');
              this.slideFilterData.maxRange = this.selectedOutbreak.periodOfFollowup;
              this.sliderDateFilterValue = new FormDateRangeSliderData({
                low: moment().add(-this.selectedOutbreak.periodOfFollowup + 1, 'days').startOf('day'),
                high: moment().add(1, 'days').endOf('day')
              });
            } else {
              // hide loading
              this.displayLoading = false;
            }
          });
      });

    // initialize breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Initialize breadcrumbs
     */
  // private initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add list breadcrumb only if we have permission
  //   if (TeamModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_TEAMS_TITLE', '/teams'));
  //   }
  //
  //   // workload breadcrumb
  //   this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_TEAMS_WORKLOAD_TITLE', '.', true));
  // }

  /**
     * Remove component resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    if (this.getSelectedOutbreakSubject) {
      this.getSelectedOutbreakSubject.unsubscribe();
      this.getSelectedOutbreakSubject = null;
    }
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

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
  initializeBreadcrumbs(): void {
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
    if (
      this.selectedOutbreak &&
            !_.isEmpty(this.teamsData)
    ) {
      // construct array of dates
      this.displayLoading = true;
      this.dates = [];
      const dates = [
        this.i18nService.instant('LNG_PAGE_TEAMS_WORKLOAD_TEAM_LABEL')
      ];
      const currentDate = moment(this.sliderDateFilterValue.low);
      while (currentDate.isSameOrBefore(this.sliderDateFilterValue.high)) {
        dates.push(currentDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
        currentDate.add(1, 'days');
      }

      // retrieve data
      if (dates.length > 1) {
        // add filter period
        this.queryBuilder.filter.byDateRange(
          'date', {
            startDate: moment(this.sliderDateFilterValue.low).startOf('day'),
            endDate: moment(this.sliderDateFilterValue.high).endOf('day')
          }
        );

        // retrieve the list of Follow Ups
        this.followUpsDataService
          .getFollowUpsPerDayTeam(this.selectedOutbreak.id, this.queryBuilder)
          .pipe(
            catchError((err) => {
              // hide loading
              this.displayLoading = false;

              this.toastV2Service.error(err);
              return throwError(err);
            })
          )
          .subscribe((metricTeamsFollowups: TeamFollowupsPerDayModel) => {
            // set headers
            this.dates = dates;

            // format data
            this.formatData(metricTeamsFollowups);
          });
      } else {
        // hide loading
        this.displayLoading = false;
      }
    } else {
      // hide loading
      this.displayLoading = false;
    }
  }

  /**
     * Format the data
     */
  formatData(metricTeamsFollowups: TeamFollowupsPerDayModel) {
    // format received data
    if (
      !_.isEmpty(this.teamsData) &&
            !_.isEmpty(metricTeamsFollowups)
    ) {
      // map teams for team search
      const teamsMap = {};
      this.teamsData.forEach((teamData) => {
        teamsMap[teamData.id ? teamData.id : 'N'] = _.cloneDeep(teamData);
      });

      // go through teams and create list of date information
      _.forEach(metricTeamsFollowups.teams, (team) => {
        // construct list of dates
        const dates = {};
        if (team.dates) {
          _.forEach(team.dates, (date) => {
            dates[moment(date.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)] = {
              totalFollowupsCount: date.totalFollowupsCount,
              successfulFollowupsCount: date.successfulFollowupsCount
            };
          });
        }

        // assign dates
        if (
          team.id &&
                    teamsMap[team.id]
        ) {
          teamsMap[team.id].dates = dates;
        } else {
          teamsMap['N'].dates = dates;
        }
      });

      // set data to show
      this.teamsDataShow = _.filter(teamsMap, (v: ITeamMap) => {
        return !_.isEmpty(v.dates);
      });
    }

    // hide loading
    this.displayLoading = false;
  }

  /**
     * Filter by slider value
     */
  filterByDateRange(value: FormDateRangeSliderData) {
    // set the new value
    this.sliderDateFilterValue = value;

    // refresh list
    this.needsRefreshList();
  }
}
