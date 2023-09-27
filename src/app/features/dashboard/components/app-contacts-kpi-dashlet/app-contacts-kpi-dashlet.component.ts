import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { MetricContactsPerCaseModel } from '../../../../core/models/metrics/metric-contacts-per-case.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { MetricContactsModel } from '../../../../core/models/metrics/metric-contacts.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { MetricContactsLostToFollowUpModel } from '../../../../core/models/metrics/metric-contacts-lost-to-follow-up.model';
import { forkJoin } from 'rxjs';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { CaseModel } from '../../../../core/models/case.model';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { MetricContactsSeenEachDays } from '../../../../core/models/metrics/metric-contacts-seen-each-days.model';
import { MetricContactsWithSuccessfulFollowUp } from '../../../../core/models/metrics/metric.contacts-with-success-follow-up.model';
import { AppKpiDashletComponent } from '../app-kpi-dashlet/app-kpi-dashlet.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-contacts-kpi-dashlet',
  templateUrl: './app-contacts-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppContactsKpiDashletComponent
  extends AppDashletV2 implements OnDestroy {
  // kpi dashlet
  @ViewChild(AppKpiDashletComponent, { static: false }) dashlet: AppKpiDashletComponent;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private relationshipDataService: RelationshipDataService,
    private followUpsDataService: FollowUpsDataService,
    private caseDataService: CaseDataService,
    private listFilterDataService: ListFilterDataService,
    authDataService: AuthDataService,
    outbreakDataService: OutbreakDataService
  ) {
    super(
      authDataService,
      outbreakDataService
    );
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Update UI
   */
  private detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Initialize dashlet
   */
  protected initializeDashlet(): void {
    // set values
    const valueColor: string = (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[EntityType.CONTACT].getColorCode();
    this.values = [
      // Contacts per case mean
      {
        name: DashboardDashlet.CONTACTS_PER_CASE_MEAN,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEAN_TITLE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // date
          if (globalFilterDate) {
            qb.filter.byDateRange(
              'contactDate', {
                endDate: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            );
          }

          // exclude discarded cases
          qb.include('people').queryBuilder.filter.where({
            classification: {
              neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
          });

          // location
          if (globalFilterLocationId) {
            qb.include('people').queryBuilder.filter
              .byEquality('addresses.parentLocationIdFilter', globalFilterLocationId);
          }

          // classification
          if (globalFilterClassificationId?.length > 0) {
            qb.include('people').queryBuilder.filter
              .where({
                and: [{
                  classification: {
                    inq: globalFilterClassificationId
                  }
                }]
              });
          }

          // retrieve data
          return this.relationshipDataService
            .getMetricsOfContactsPerCase(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricContactsPerCaseModel) => {
          return Math.round(response.meanNoContactsPerCase).toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsPerCaseMeanDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          _globalFilterDate,
          _globalFilterLocationId,
          _globalFilterClassificationId
        ) => undefined,
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEAN_TITLE_DESCRIPTION')
      },

      // Contacts per case median
      {
        name: DashboardDashlet.CONTACTS_PER_CASE_MEDIAN,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEDIAN_TITLE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // date
          if (globalFilterDate) {
            qb.filter.byDateRange(
              'contactDate', {
                endDate: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            );
          }

          // exclude discarded cases
          qb.include('people').queryBuilder.filter.where({
            classification: {
              neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
          });

          // location
          if (globalFilterLocationId) {
            qb.include('people').queryBuilder.filter
              .byEquality('addresses.parentLocationIdFilter', globalFilterLocationId);
          }

          // classification
          if (globalFilterClassificationId?.length > 0) {
            qb.include('people').queryBuilder.filter
              .where({
                and: [{
                  classification: {
                    inq: globalFilterClassificationId
                  }
                }]
              });
          }

          // retrieve data
          return this.relationshipDataService
            .getMetricsOfContactsPerCase(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricContactsPerCaseModel) => {
          return Math.round(response.medianNoContactsPerCase).toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsPerCaseMedianDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          _globalFilterDate,
          _globalFilterLocationId,
          _globalFilterClassificationId
        ) => undefined,
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEDIAN_TITLE_DESCRIPTION')
      },

      // Contacts on the follow-up list
      {
        name: DashboardDashlet.CONTACTS_ON_THE_FOLLOW_UP_LIST,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_FOLLOWUP_LIST_TITLE',
        prefixData: () => ({
          date: this.globalFilterDate ?
            LocalizationHelper.displayDate(this.globalFilterDate) :
            '—'
        }),
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // change the way we build query
          qb.filter.firstLevelConditions();

          // add location condition
          if (globalFilterLocationId) {
            qb.filter.byEquality(
              'addresses.parentLocationIdFilter',
              globalFilterLocationId
            );
          }

          // classification
          // !!! must be on first level and not under $and
          if (globalFilterClassificationId?.length > 0) {
            qb.filter.bySelect(
              'classification',
              globalFilterClassificationId,
              false,
              null
            );
          }

          // date
          if (globalFilterDate) {
            qb.filter
              .byEquality(
                'startDate',
                LocalizationHelper.toMoment(globalFilterDate).startOf('day').toISOString()
              ).byEquality(
                'endDate',
                LocalizationHelper.toMoment(globalFilterDate).endOf('day').toISOString()
              );
          }

          // retrieve data
          return this.followUpsDataService
            .getCountIdsOfContactsOnTheFollowUpList(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricContactsModel) => {
          return response.contactsCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsFromFollowUpsDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return ContactModel.canList(this.authUser) ?
            {
              link: ['/contacts'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_FOLLOWUP_LIST_TITLE_DESCRIPTION')
      },

      // Contacts Lost to follow-up
      {
        name: DashboardDashlet.CONTACTS_LOST_TO_FOLLOW_UP,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_LOST_TO_FOLLOW_UP',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // change the way we build query
          qb.filter.firstLevelConditions();

          // date
          if (globalFilterDate) {
            qb.filter.where({
              dateOfReporting: {
                lte: LocalizationHelper.toMoment(globalFilterDate).toISOString()
              }
            });
          }

          // location
          if (globalFilterLocationId) {
            qb.filter.byEquality('addresses.parentLocationIdFilter', globalFilterLocationId);
          }

          // classification
          // !!! must be on first level and not under $and
          if (globalFilterClassificationId?.length > 0) {
            qb.filter.bySelect(
              'classification',
              globalFilterClassificationId,
              false,
              null
            );
          }

          // retrieve data
          return this.followUpsDataService
            .getNumberOfContactsWhoAreLostToFollowUp(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricContactsLostToFollowUpModel) => {
          return response.contactsCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsLostToFollowUpsDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return ContactModel.canList(this.authUser) ?
            {
              link: ['/contacts'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_LOST_TO_FOLLOW_UP_DESCRIPTION')
      },

      // Contacts Not Seen
      {
        name: DashboardDashlet.CONTACTS_NOT_SEEN_IN_X_DAYS,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NOT_SEEN_TITLE_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NOT_SEEN_TITLE_AFTER_VALUE',
        inputValue: this.selectedOutbreak.noDaysNotSeen,
        refresh: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // change the way we build query
          qb.filter.firstLevelConditions();

          // convert
          if (inputValue !== undefined) {
            // add number of days until current day
            if (globalFilterDate) {
              inputValue += LocalizationHelper.now().endOf('day').diff(LocalizationHelper.toMoment(globalFilterDate).endOf('day'), 'days');
            }

            // create filter
            qb.filter.byEquality(
              'noDaysNotSeen',
              inputValue
            );
          }

          // date
          if (globalFilterDate) {
            qb.filter.where({
              date: {
                lte: LocalizationHelper.toMoment(globalFilterDate).toISOString()
              }
            });
          }

          // location
          if (globalFilterLocationId) {
            qb.include('contact').queryBuilder.filter
              .byEquality('addresses.parentLocationIdFilter', globalFilterLocationId);
          }

          // classification
          // !!! must be on first level and not under $and
          if (globalFilterClassificationId?.length > 0) {
            qb.filter.bySelect(
              'classification',
              globalFilterClassificationId,
              false,
              null
            );
          }

          // retrieve data
          return this.followUpsDataService
            .getCountIdsOfContactsNotSeen(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricContactsModel) => {
          return response.contactsCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsNotSeenInXDaysDashlet(this.authUser);
        },
        getLink: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return ContactModel.canList(this.authUser) ?
            {
              link: ['/contacts'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                x: inputValue,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_NOT_SEEN_TITLE_BEFORE_VALUE_DESCRIPTION')
      },

      // Number of contacts becoming cases in period & location
      {
        name: DashboardDashlet.CONTACTS_BECOMING_CASES_IN_TIME_AND_SPACE,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // change the way we build query
          qb.filter.firstLevelConditions();

          // exclude discarded cases
          qb.filter.where({
            classification: {
              neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
          });

          // add location condition
          if (globalFilterLocationId) {
            qb.filter.byEquality(
              'addresses.parentLocationIdFilter',
              globalFilterLocationId
            );
          }

          // classification
          if (globalFilterClassificationId?.length > 0) {
            qb.filter.where({
              and: [{
                classification: {
                  inq: globalFilterClassificationId
                }
              }]
            });
          }

          // date
          if (globalFilterDate) {
            qb.filter.byBoolean(
              'wasContact',
              true
            );
            qb.filter.byDateRange(
              'dateBecomeCase', {
                endDate: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            );
          }

          // filter
          const qbAll = new RequestQueryBuilder();

          // change the way we build query
          qbAll.filter.firstLevelConditions();

          // exclude discarded cases
          qbAll.filter.where({
            classification: {
              neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
          });

          // add location condition
          if (globalFilterLocationId) {
            qbAll.filter.byEquality(
              'addresses.parentLocationIdFilter',
              globalFilterLocationId
            );
          }

          // classification
          if (globalFilterClassificationId?.length > 0) {
            qbAll.filter.where({
              and: [{
                classification: {
                  inq: globalFilterClassificationId
                }
              }]
            });
          }

          // retrieve data
          return forkJoin([
            this.caseDataService.getCasesCount(
              this.selectedOutbreak.id,
              qb
            ),
            this.caseDataService.getCasesCount(
              this.selectedOutbreak.id,
              qbAll
            )
          ]);
        },
        process: ([qbCountResult, countResult]: [IBasicCount, IBasicCount]) => {
          return `${qbCountResult.count.toLocaleString('en')}/${countResult.count}`;
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsBecomeCasesDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return CaseModel.canList(this.authUser) ?
            {
              link: ['/cases'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE_DESCRIPTION')
      },

      // Contacts seen each day
      {
        name: DashboardDashlet.CONTACTS_SEEN_EACH_DAY,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_SEEN_EACH_DAY',
        prefixData: () => ({
          date: this.globalFilterDate ?
            LocalizationHelper.displayDate(this.globalFilterDate) :
            '—'
        }),
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // retrieve data
          return this.listFilterDataService
            .filterContactsSeen(
              LocalizationHelper.toMoment(globalFilterDate),
              globalFilterLocationId,
              globalFilterClassificationId
            );
        },
        process: (response: MetricContactsSeenEachDays) => {
          return response.contactsSeenCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsSeenDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return ContactModel.canList(this.authUser) ?
            {
              link: ['/contacts'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_SEEN,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_SEEN_EACH_DAY_DESCRIPTION')
      },

      // Contacts with successful follow-ups
      {
        name: DashboardDashlet.CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP,
        group: DashboardKpiGroup.CONTACT,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP',
        prefixData: () => ({
          date: this.globalFilterDate ?
            LocalizationHelper.displayDate(this.globalFilterDate) :
            '—'
        }),
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // retrieve data
          return this.listFilterDataService
            .filterContactsWithSuccessfulFollowup(
              LocalizationHelper.toMoment(globalFilterDate),
              globalFilterLocationId,
              globalFilterClassificationId
            );
        },
        process: (response: MetricContactsWithSuccessfulFollowUp) => {
          return `${response.contactsWithSuccessfulFollowupsCount.toLocaleString('en')}/${response.totalContactsWithFollowupsCount.toLocaleString('en')}`;
        },
        hasPermission: () => {
          return DashboardModel.canViewContactsWithSuccessfulFollowUpsDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return ContactModel.canList(this.authUser) ?
            {
              link: ['/contacts'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP,
                [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                global: JSON.stringify({
                  date: globalFilterDate,
                  locationId: globalFilterLocationId ?
                    globalFilterLocationId :
                    undefined,
                  classificationId: globalFilterClassificationId?.length > 0 ?
                    globalFilterClassificationId :
                    undefined
                })
              }
            } :
            undefined;
        },
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP_DESCRIPTION')
      }
    ];

    // update ui
    this.detectChanges();
  }
}
