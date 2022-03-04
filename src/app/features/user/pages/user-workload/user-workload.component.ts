import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserFollowupsPerDayModel } from '../../../../core/models/user-followups-per-day.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import * as _ from 'lodash';
import { FormDateRangeSliderData } from '../../../../shared/xt-forms/components/form-date-range-slider/form-date-range-slider.component';
import { Subscription } from 'rxjs';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { UserModel } from '../../../../core/models/user.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

interface IUserMap {
  id: string;
  dates: {};
  name: string;
}

@Component({
  selector: 'app-user-workload',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './user-workload.component.html',
  styleUrls: ['./user-workload.component.less']
})
export class UserWorkloadComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  dates: string[] = [];
  usersDataShow: IUserMap[] = [];
  usersData: IUserMap[];

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
    private snackbarService: SnackbarService,
    private i18nService: I18nService,
    private userDataService: UserDataService
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
    // get users
    this.displayLoading = true;
    this.userDataService
      .getUsersList()
      .subscribe((users) => {
        // map users
        this.usersData = [{
          id: null,
          name: this.i18nService.instant('LNG_PAGE_USERS_WORKLOAD_NO_USER_LABEL'),
          dates: {}
        }];
        _.forEach(users, (user: UserModel) => {
          this.usersData.push({
            id: user.id,
            name: user.name,
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
  //   if (UserModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '/users'));
  //   }
  //
  //   // workload breadcrumb
  //   this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_USERS_WORKLOAD_TITLE', '.', true));
  // }

  /**
     * Remove component resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

    if (this.getSelectedOutbreakSubject) {
      this.getSelectedOutbreakSubject.unsubscribe();
      this.getSelectedOutbreakSubject = null;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (
      this.selectedOutbreak &&
            !_.isEmpty(this.usersData)
    ) {
      // construct array of dates
      this.displayLoading = true;
      this.dates = [];
      const dates = [
        this.i18nService.instant('LNG_PAGE_USERS_WORKLOAD_USER_LABEL')
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
          .getFollowUpsPerDayUser(this.selectedOutbreak.id, this.queryBuilder)
          .pipe(
            catchError((err) => {
              // hide loading
              this.displayLoading = false;

              this.snackbarService.showApiError(err);
              finishCallback([]);
              return throwError(err);
            })
          )
          .subscribe((metricUsersFollowups: UserFollowupsPerDayModel) => {
            // set headers
            this.dates = dates;

            // format data
            this.formatData(metricUsersFollowups);

            // finished
            finishCallback([]);
          });
      } else {
        // hide loading
        this.displayLoading = false;

        // finished
        finishCallback([]);
      }
    } else {
      // hide loading
      this.displayLoading = false;

      // finished
      finishCallback([]);
    }
  }

  /**
     * Format the data
     */
  formatData(metricUsersFollowups: UserFollowupsPerDayModel) {
    // format received data
    if (
      !_.isEmpty(this.usersData) &&
            !_.isEmpty(metricUsersFollowups)
    ) {
      // map users for user search
      const usersMap = {};
      this.usersData.forEach((userData) => {
        usersMap[userData.id ? userData.id : 'N'] = _.cloneDeep(userData);
      });

      // go through users and create list of date information
      _.forEach(metricUsersFollowups.users, (user) => {
        // construct list of dates
        const dates = {};
        if (user.dates) {
          _.forEach(user.dates, (date) => {
            dates[moment(date.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)] = {
              totalFollowupsCount: date.totalFollowupsCount,
              successfulFollowupsCount: date.successfulFollowupsCount
            };
          });
        }

        // assign dates
        if (
          user.id &&
                    usersMap[user.id]
        ) {
          usersMap[user.id].dates = dates;
        } else {
          usersMap['N'].dates = dates;
        }
      });

      // set data to show
      this.usersDataShow = _.filter(usersMap, (v: IUserMap) => {
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
