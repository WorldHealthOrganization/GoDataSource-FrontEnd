import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { MetricCasesWithContactsModel } from '../../../../core/models/metrics/metric-cases-contacts.model';
import { Constants } from '../../../../core/models/constants';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { CaseModel } from '../../../../core/models/case.model';
import { MetricNewCasesWithContactsModel } from '../../../../core/models/metric-new-cases-contacts.model';
import { MetricCasesTransmissionChainsModel } from '../../../../core/models/metrics/metric-cases-transmission-chains.model';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { AppKpiDashletComponent } from '../app-kpi-dashlet/app-kpi-dashlet.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { MetricCasesLostToFollowUpModel } from '../../../../core/models/metrics/metric-cases-lost-to-follow-up.model';
import { MetricCasesModel } from '../../../../core/models/metrics/metric-cases.model';
import { MetricCasesSeenEachDays } from '../../../../core/models/metrics/metric-cases-seen-each-days.model';
import { MetricCasesWithSuccessfulFollowUp } from '../../../../core/models/metrics/metric.cases-with-success-follow-up.model';

@Component({
  selector: 'app-cases-kpi-dashlet',
  templateUrl: './app-cases-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCasesKpiDashletComponent
  extends AppDashletV2 implements OnDestroy {
  // kpi dashlet
  @ViewChild(AppKpiDashletComponent, { static: false }) dashlet: AppKpiDashletComponent;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private caseDataService: CaseDataService,
    private relationshipDataService: RelationshipDataService,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private listFilterDataService: ListFilterDataService,
    private followUpsDataService: FollowUpsDataService,
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
    const valueColor: string = (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[EntityType.CASE].getColorCode();
    this.values = [
      // Cases who have died
      {
        name: DashboardDashlet.CASES_DECEASED,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_DECEASED_TITLE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // exclude discarded cases
          qb.filter.where({
            classification: {
              neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
          });

          // date
          if (globalFilterDate) {
            qb.filter.byDateRange(
              'dateOfOutcome', {
                endDate: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            );
          }

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

          // retrieve data
          return this.caseDataService
            .getDeceasedCasesCount(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCaseDeceasedDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_DECEASED,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_DECEASED_TITLE_DESCRIPTION')
      },

      // Cases hospitalised
      {
        name: DashboardDashlet.CASES_HOSPITALISED,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_HOSPITALISED_TITLE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

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

          // retrieve cases currently hospitalized
          return this.caseDataService
            .getHospitalisedCasesCount(
              this.selectedOutbreak.id,
              globalFilterDate,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCaseHospitalizedDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_HOSPITALISED_TITLE_DESCRIPTION')
      },

      // Cases with Less than x Contacts
      {
        name: DashboardDashlet.CASES_WITH_LESS_THAN_X_CONTACTS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_AFTER_VALUE',
        inputValue: this.selectedOutbreak.noLessContacts,
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

          // convert noLessContacts to number as the API expects
          if (inputValue !== undefined) {
            // create filter for daysNotSeen
            qb.filter.byEquality(
              'noLessContacts',
              inputValue
            );
          }

          // retrieve cases currently hospitalized
          return this.relationshipDataService
            .getCountIdsOfCasesLessThanXContacts(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricCasesWithContactsModel) => {
          return response.casesCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCaseWithLessThanXCotactsDashlet(this.authUser);
        },
        getLink: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return CaseModel.canList(this.authUser) ?
            {
              link: ['/cases'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_BEFORE_VALUE_DESCRIPTION')
      },

      // New cases detected in the previous x days among contacts
      {
        name: DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_AMONG_KNOWN_CONTACTS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_NEW_PREVIOUS_DAYS_CONTACTS_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_CASES_NEW_PREVIOUS_DAYS_CONTACTS_AFTER_VALUE',
        inputValue: this.selectedOutbreak.noDaysAmongContacts,
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
            qb.filter.where({
              dateOfReporting: {
                lte: LocalizationHelper.toMoment(globalFilterDate).toISOString()
              }
            });
          }

          // filter
          if (inputValue !== undefined) {
            // add number of days until current day
            if (globalFilterDate) {
              inputValue += LocalizationHelper.now().endOf('day').diff(LocalizationHelper.toMoment(globalFilterDate).endOf('day'), 'days');
            }

            // create filter for daysNotSeen
            qb.filter.byEquality(
              'noDaysAmongContacts',
              inputValue
            );
          }

          // retrieve cases currently hospitalized
          return this.relationshipDataService
            .getCountIdsOfCasesAmongKnownContacts(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricNewCasesWithContactsModel) => {
          return `${response.newCasesAmongKnownContactsCount.toLocaleString('en')}/${response.newCasesCount.toLocaleString('en')}`;
        },
        hasPermission: () => {
          return DashboardModel.canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(this.authUser);
        },
        getLink: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return CaseModel.canList(this.authUser) ?
            {
              link: ['/cases'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_NEW_PREVIOUS_DAYS_CONTACTS_BEFORE_VALUE_DESCRIPTION')
      },

      // Cases refusing to be transferred to a treatment unit
      {
        name: DashboardDashlet.SUSPECT_CASES_REFUSING_TO_BE_TRANSFERRED_TO_A_TREATMENT_UNIT,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_REFUSING_TREATMENT_TITLE',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

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
            qb.filter.where({
              dateOfReporting: {
                lte: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            });
          }

          // retrieve cases currently hospitalized
          return this.caseDataService
            .getCasesRefusingTreatmentCount(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesRefusingTreatmentDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_REFUSING_TREATMENT_TITLE_DESCRIPTION')
      },

      // New cases in previous x days in known transmission chains
      {
        name: DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_OUTSIDE_THE_TRANSMISSION_CHAINS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_NEW_CASES_PREVIOUS_DAYS_TRANSMISSION_CHAINS_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_NEW_CASES_PREVIOUS_DAYS_TRANSMISSION_CHAINS_AFTER_VALUE',
        inputValue: this.selectedOutbreak.noDaysInChains,
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
              'noDaysInChains',
              inputValue
            );
          }

          // date
          if (globalFilterDate) {
            qb.filter.where({
              contactDate: {
                lte: LocalizationHelper.toMoment(globalFilterDate).toISOString()
              }
            });
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

          // retrieve cases currently hospitalized
          return this.relationshipDataService
            .getCountOfCasesInTheTransmissionChains(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricCasesTransmissionChainsModel) => {
          return `${response.newCases.toLocaleString('en')}/${response.total.toLocaleString('en')}`;
        },
        hasPermission: () => {
          return DashboardModel.canViewNewCasesFromKnownCOTDashlet(this.authUser);
        },
        getLink: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return CaseModel.canList(this.authUser) ?
            {
              link: ['/cases'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_IN_THE_TRANSMISSION_CHAINS,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_NEW_CASES_PREVIOUS_DAYS_TRANSMISSION_CHAINS_BEFORE_VALUE_DESCRIPTION')
      },

      // Suspect Cases where the lab result is pending
      {
        name: DashboardDashlet.SUSPECT_CASES_WITH_PENDING_LAB_RESULT,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_PENDING_LAB_RESULT',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

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
            qb.filter.where({
              dateOfReporting: {
                lte: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            });
          }

          // retrieve cases currently hospitalized
          return this.caseDataService
            .getCasesPendingLabResultCount(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesWithPendingLabResultsDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_PENDING_LAB_RESULT_DESCRIPTION')
      },

      // Number of cases who are not identified though known contact list
      {
        name: DashboardDashlet.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_NOT_IDENTIFIED_THROUGH_CONTACTS',
        refresh: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          // filter
          const qb = new RequestQueryBuilder();

          // merge other conditions
          qb.merge(this.listFilterDataService.filterCasesNotIdentifiedThroughContacts());

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
            qb.filter.where({
              dateOfReporting: {
                lte: LocalizationHelper.toMoment(globalFilterDate).endOf('day').format()
              }
            });
          }

          // retrieve cases currently hospitalized
          return this.caseDataService
            .getCasesCount(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesNotIdentifiedThroughContactsDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_NOT_IDENTIFIED_THROUGH_CONTACTS_DESCRIPTION')
      },

      // Cases on the follow-up list
      {
        name: DashboardDashlet.CASES_ON_THE_FOLLOW_UP_LIST,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_FOLLOWUP_LIST_TITLE',
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
            .getCountIdsOfCasesOnTheFollowUpList(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricCasesModel) => {
          return response.casesCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesFromFollowUpsDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_FOLLOWUP_LIST,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_FOLLOWUP_LIST_TITLE_DESCRIPTION')
      },

      // Cases Lost to follow-up
      {
        name: DashboardDashlet.CASES_LOST_TO_FOLLOW_UP,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_LOST_TO_FOLLOW_UP',
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
            .getNumberOfCasesWhoAreLostToFollowUp(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricCasesLostToFollowUpModel) => {
          return response.casesCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesLostToFollowUpsDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_LOST_TO_FOLLOW_UP,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_LOST_TO_FOLLOW_UP_DESCRIPTION')
      },

      // Cases Not Seen
      {
        name: DashboardDashlet.CASES_NOT_SEEN_IN_X_DAYS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_NOT_SEEN_TITLE_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_CASES_NOT_SEEN_TITLE_AFTER_VALUE',
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
            qb.include('case').queryBuilder.filter
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
            .getCountIdsOfCasesNotSeen(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricCasesModel) => {
          return response.casesCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesNotSeenInXDaysDashlet(this.authUser);
        },
        getLink: (
          inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return CaseModel.canList(this.authUser) ?
            {
              link: ['/cases'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_NOT_SEEN,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_NOT_SEEN_TITLE_BEFORE_VALUE_DESCRIPTION')
      },

      // Cases seen each day
      {
        name: DashboardDashlet.CASES_SEEN_EACH_DAY,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_SEEN_EACH_DAY',
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
            .filterCasesSeen(
              LocalizationHelper.toMoment(globalFilterDate),
              globalFilterLocationId,
              globalFilterClassificationId
            );
        },
        process: (response: MetricCasesSeenEachDays) => {
          return response.casesSeenCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesSeenDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_SEEN,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_SEEN_EACH_DAY_DESCRIPTION')
      },

      // Cases with successful follow-ups
      {
        name: DashboardDashlet.CASES_WITH_SUCCESSFUL_FOLLOW_UP,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_WITH_SUCCESSFUL_FOLLOW_UP',
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
            .filterCasesWithSuccessfulFollowup(
              LocalizationHelper.toMoment(globalFilterDate),
              globalFilterLocationId,
              globalFilterClassificationId
            );
        },
        process: (response: MetricCasesWithSuccessfulFollowUp) => {
          return `${response.casesWithSuccessfulFollowupsCount.toLocaleString('en')}/${response.totalCasesWithFollowupsCount.toLocaleString('en')}`;
        },
        hasPermission: () => {
          return DashboardModel.canViewCasesWithSuccessfulFollowUpsDashlet(this.authUser);
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
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_FOLLOWED_UP,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_WITH_SUCCESSFUL_FOLLOW_UP_DESCRIPTION')
      }
    ];

    // update ui
    this.detectChanges();
  }
}
