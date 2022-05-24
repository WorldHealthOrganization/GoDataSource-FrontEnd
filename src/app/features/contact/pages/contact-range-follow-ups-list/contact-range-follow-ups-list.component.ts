import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ContactModel } from '../../../../core/models/contact.model';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogField } from '../../../../shared/components';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormDateRangeSliderData } from '../../../../shared/xt-forms/components/form-date-range-slider/form-date-range-slider.component';
import { FollowUpPage } from '../../typings/follow-up-page';
import { RangeFollowUpsModel } from '../../../../core/models/range-follow-ups.model';
import { RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { Observable } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { Subscription } from 'rxjs/internal/Subscription';
import { AddressType } from '../../../../core/models/address.model';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-contact-range-follow-ups-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './contact-range-follow-ups-list.component.html',
  styleUrls: ['./contact-range-follow-ups-list.component.less']
})
export class ContactRangeFollowUpsListComponent
  // #TODO - remove list component paginator ?
  extends ListComponent<any>
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  outbreakSubscriber: Subscription;

  // which follow-ups list page are we visiting?
  rootPage: FollowUpPage = FollowUpPage.RANGE;

  // follow ups list
  followUpsGroupedByContact: {
    person: ContactModel | CaseModel,
    followUps: {
      [date: string]: FollowUpModel[]
    }
  }[] = [];
  daysToDisplay: string[] = [];
  dailyStatuses: {
    // status ID => Status
    [statusId: string]: ReferenceDataEntryModel
  } = {};

  // used for pagination
  followUpsGroupedByContactCount$: Observable<IBasicCount>;
  teamsList$: Observable<TeamModel[]>;

  // loading flag - display spinner instead of table
  displayLoading: boolean = false;

  // export
  exportRangeFollowUpsUrl: string;
  exportRangeFollowUpsFileName: string;
  exportRangeExtraAPIData: {
    [key: string]: any
  };
  exportRangeExtraDialogFields: DialogField[];

  // constants
  ExportDataExtension = ExportDataExtension;
  ReferenceDataCategory = ReferenceDataCategory;
  FollowUpModel = FollowUpModel;
  EntityType = EntityType;

  filtersVisible: boolean = false;

  filters: {
    contactName: any,
    visualId: any,
    dateOfLastContact: any,
    dateOfTheEndOfTheFollowUp: any,
    locationIds: string[],
    teamIds: string[],
    displayMissedFollowUps: boolean
    displayMissedFollowUpsNoDays: number
  } = {
      contactName: null,
      visualId: null,
      dateOfLastContact: null,
      dateOfTheEndOfTheFollowUp: null,
      locationIds: [],
      teamIds: [],
      displayMissedFollowUps: false,
      displayMissedFollowUpsNoDays: 1
    };

  /**
     * Filter slider data
     */
  slideFilterData: {
    minDate: Moment,
    maxDate: Moment,
    maxRange: number
  } = {
      minDate: moment().startOf('day'),
      maxDate: moment().endOf('day'),
      maxRange: 0
    };

  /**
     * Slider Date Filter Value
     */
  sliderDateFilterValue: FormDateRangeSliderData;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private followUpsDataService: FollowUpsDataService,
    private toastV2Service: ToastV2Service,
    private referenceDataDataService: ReferenceDataDataService,
    private i18nService: I18nService,
    private genericDataService: GenericDataService,
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
    // get the authenticated user
    this.teamsList$ = this.teamDataService.getTeamsList().pipe(share());

    // add page title
    this.exportRangeFollowUpsFileName = this.i18nService.instant('LNG_PAGE_LIST_RANGE_FOLLOW_UPS_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');

    // retrieve group by options
    this.genericDataService
      .getRangeFollowUpGroupByOptions()
      .subscribe((options) => {
        this.exportRangeExtraDialogFields = [
          new DialogField({
            name: 'groupBy',
            placeholder: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
            inputOptions: options,
            value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
            required: true
          })
        ];
      });

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // selected outbreak
        this.selectedOutbreak = selectedOutbreak;

        // export url
        this.exportRangeFollowUpsUrl = null;
        this.slideFilterData = {
          minDate: moment().startOf('day'),
          maxDate: moment().endOf('day'),
          maxRange: 0
        };
        if (
          this.selectedOutbreak &&
                    this.selectedOutbreak.id
        ) {
          this.exportRangeFollowUpsUrl = `outbreaks/${this.selectedOutbreak.id}/contacts/range-list/export`;

          // set filter slider info
          this.slideFilterData.minDate = moment(this.selectedOutbreak.startDate).startOf('day');
          this.slideFilterData.maxDate = moment().add(1, 'days').endOf('day');
          this.slideFilterData.maxRange = this.selectedOutbreak.periodOfFollowup;

          // initialize pagination
          this.initPaginator();

          // filter
          this.filterByDateRange(new FormDateRangeSliderData({
            low: moment().add(-this.selectedOutbreak.periodOfFollowup + 1, 'days').startOf('day'),
            high: moment().add(1, 'days').endOf('day')
          }), true);
        }

        // daily status colors
        this.referenceDataDataService
          .getReferenceDataByCategory(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS)
          .subscribe((data: ReferenceDataCategoryModel) => {
            this.dailyStatuses = {};
            _.each(data.entries, (entry: ReferenceDataEntryModel) => {
              this.dailyStatuses[entry.id] = entry;
            });
          });
      });

    // initialize breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {}

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
  // private initializeBreadcrumbs() {
  //   // init breadcrumbs
  //   this.breadcrumbs = [];
  //
  //   // contacts breadcrumb
  //   if (ContactModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel(
  //         'LNG_PAGE_LIST_CONTACTS_TITLE',
  //         '/contacts'
  //       )
  //     );
  //   }
  //
  //   // current page breadcrumb
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel(
  //       'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_TITLE',
  //       '.',
  //       true
  //     )
  //   );
  // }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
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
    // order by name
    this.queryBuilder.sort.clear();
    this.queryBuilder.sort
      .by(
        'contact.firstName',
        RequestSortDirection.ASC
      )
      .by(
        'contact.lastName',
        RequestSortDirection.ASC
      )
      .by(
        'contact.visualId',
        RequestSortDirection.ASC
      );

    // retrieve the list of Follow Ups
    this.displayLoading = true;
    this.followUpsGroupedByContact = [];
    let minDate: Moment;
    let maxDate: Moment;
    this.followUpsDataService
      .getRangeFollowUpsList(
        this.selectedOutbreak.id,
        this.queryBuilder
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((rangeData: RangeFollowUpsModel[]) => {
        this.followUpsGroupedByContact = _.map(rangeData, (data: RangeFollowUpsModel) => {
          // determine follow-up questionnaire alertness
          data.followUps = FollowUpModel.determineAlertness(
            this.selectedOutbreak.contactFollowUpTemplate,
            data.followUps
          );

          // get grouped followups by contact & date
          return {
            person: data.person,
            followUps: _.chain(data.followUps)
              .groupBy((followUp: FollowUpModel) => {
                // determine min & max dates
                const date = moment(followUp.date).startOf('day');
                if (followUp.statusId) {
                  minDate = minDate ?
                    (date.isBefore(minDate) ? date : minDate) :
                    date;
                  maxDate = maxDate ?
                    (date.isAfter(maxDate) ? moment(date) : maxDate) :
                    moment(date);
                }

                // sort by date ascending
                return date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
              })
              .mapValues((followUpData: FollowUpModel[]) => {
                return _.sortBy(
                  followUpData,
                  (followUp: FollowUpModel) => {
                    return moment(followUp.date);
                  }
                );
              })
              .value()
          };
        });

        // create dates array
        this.daysToDisplay = [];
        if (
          minDate &&
                      maxDate
        ) {
          // push dates
          while (minDate.isSameOrBefore(maxDate)) {
            // add day to list
            this.daysToDisplay.push(minDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));

            // next day
            minDate.add('1', 'days');
          }
        }

        // display data
        this.displayLoading = false;
      });
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    if (this.selectedOutbreak) {
      // remove paginator from query builder
      const countQueryBuilder = _.cloneDeep(this.queryBuilder);
      countQueryBuilder.paginator.clear();
      countQueryBuilder.sort.clear();
      this.followUpsGroupedByContactCount$ = this.followUpsDataService
        .getRangeFollowUpsListCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  /**
     * Filter by slider value
     */
  filterByDateRange(
    value: FormDateRangeSliderData,
    instant: boolean = false
  ) {
    // set the new value
    this.sliderDateFilterValue = value;

    // cleanup
    this.queryBuilder.filter.removePathCondition('date');
    this.queryBuilder.filter.removePathCondition('or.date');
    this.queryBuilder.filter.removePathCondition('or.statusId');

    // determine limits
    const startDate: Moment = moment(this.sliderDateFilterValue.low).startOf('day');
    const endDate: Moment = moment(this.sliderDateFilterValue.high).endOf('day');

    // do we need to account for missed follow-ups ?
    if (
      this.filters.displayMissedFollowUps &&
            this.filters.displayMissedFollowUpsNoDays > 0
    ) {
      this.queryBuilder.filter.where({
        or: [{
          date: {
            between: [
              startDate,
              endDate
            ]
          }
        }, {
          statusId: {
            inq: [
              'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_PERFORMED',
              'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_MISSED',
              'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_ATTEMPTED'
            ]
          },
          date: {
            between: [
              moment(startDate).add(-this.filters.displayMissedFollowUpsNoDays, 'days').startOf('day'),
              endDate
            ]
          }
        }]
      });
    } else {
      // filter
      this.queryBuilder.filter.byDateRange(
        'date', {
          startDate,
          endDate
        }
      );

      // set export data
      this.exportRangeExtraAPIData = {
        startDate,
        endDate
      };
    }

    // refresh list
    this.needsRefreshList(instant);
  }

  /**
     * Reset filters
     */
  resetFilters() {
    // reset filters in UI
    this.filters = {
      contactName: null,
      visualId: null,
      dateOfLastContact: null,
      dateOfTheEndOfTheFollowUp: null,
      locationIds: [],
      teamIds: [],
      displayMissedFollowUps: false,
      displayMissedFollowUpsNoDays: 1
    };

    // reset applied filters
    this.resetFiltersToSideFilters();

    // apply default filter
    if (this.sliderDateFilterValue) {
      this.filterByDateRange(this.sliderDateFilterValue);
    }

    // hide filters
    this.filtersVisible = false;

    // refresh list
    this.needsRefreshList();
  }

  /**
     * Apply filters
     */
  applyFilters() {
    // clear query builder and apply each filter separately
    this.queryBuilder.clear();

    // apply default filter
    if (this.sliderDateFilterValue) {
      this.filterByDateRange(this.sliderDateFilterValue);
    }

    if (this.filters.contactName !== null) {
      this.queryBuilder.addChildQueryBuilder('contact')
        .filter.byTextMultipleProperties([ 'firstName', 'lastName'], this.filters.contactName);
    }

    if (this.filters.visualId !== null) {
      this.queryBuilder.addChildQueryBuilder('contact')
        .filter.byText('visualId', this.filters.visualId);
    }

    if (this.filters.dateOfLastContact !== null) {
      this.queryBuilder.addChildQueryBuilder('contact')
        .filter.byDateRange('dateOfLastContact', this.filters.dateOfLastContact);
    }

    if (this.filters.dateOfTheEndOfTheFollowUp !== null) {
      this.queryBuilder.addChildQueryBuilder('contact')
        .filter.byDateRange('followUp.endDate', this.filters.dateOfTheEndOfTheFollowUp);
    }

    if (this.filters.teamIds !== null) {
      this.queryBuilder.filter
        .bySelect('teamId', this.filters.teamIds, true, null);
    }

    // filter by contact locations
    // only current addresses
    if (!_.isEmpty(this.filters.locationIds)) {
      this.queryBuilder
        .addChildQueryBuilder('contact').filter
        .where({
          addresses: {
            $elemMatch: {
              typeId: AddressType.CURRENT_ADDRESS,
              parentLocationIdFilter: {
                $in: this.filters.locationIds
              }
            }
          }
        });
    }

    // hide filters
    this.filtersVisible = false;

    // refresh list
    this.needsRefreshList();
  }

  /**
     * Show/Hide filters
     */
  toggleFilters() {
    this.filtersVisible = !this.filtersVisible;
  }

  /**
     * Show/Hide filters button label
     */
  get toggleFiltersButtonLabel(): string {
    return this.filtersVisible ? 'LNG_COMMON_BUTTON_HIDE_FILTERS' : 'LNG_COMMON_BUTTON_SHOW_FILTERS';
  }
}
