import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { MetricIndependentTransmissionChainsModel } from '../../../../core/models/metrics/metric-independent-transmission-chains.model';
import { Constants } from '../../../../core/models/constants';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { AppKpiDashletComponent } from '../app-kpi-dashlet/app-kpi-dashlet.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-cot-kpi-dashlet',
  templateUrl: './app-cot-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCotKpiDashletComponent
  extends AppDashletV2 implements OnDestroy {
  // kpi dashlet
  @ViewChild(AppKpiDashletComponent, { static: false }) dashlet: AppKpiDashletComponent;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private i18nService: I18nService,
    private transmissionChainDataService: TransmissionChainDataService,
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
    const valueColor: string = '#65007d';
    this.values = [
      // Contacts per case mean
      {
        name: DashboardDashlet.INDEPENDENT_TRANSMISSION_CHAINS,
        group: DashboardKpiGroup.TRANSMISSION_CHAIN,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_INDEPENDENT_TRANSMISSION_CHAINS',
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
            qb.filter.byEquality(
              'endDate',
              LocalizationHelper.toMoment(globalFilterDate).endOf('day').toISOString()
            );
          }

          // location
          if (globalFilterLocationId) {
            qb.addChildQueryBuilder('person').filter.where({
              or: [
                {
                  type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                  'address.parentLocationIdFilter': globalFilterLocationId
                }, {
                  type: {
                    inq: [
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                    ]
                  },
                  'addresses.parentLocationIdFilter': globalFilterLocationId
                }
              ]
            });
          }

          // discarded cases
          // handled by API
          // NOTHING to do here

          // classification
          if (globalFilterClassificationId?.length > 0) {
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
                    inq: globalFilterClassificationId
                  }
                }
              ]
            };

            // isolated classification
            qb.filter.where(classificationConditions);

            // person
            qb.addChildQueryBuilder('person').filter.where(classificationConditions);
          }

          // retrieve data
          return this.transmissionChainDataService
            .getCountIndependentTransmissionChains(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricIndependentTransmissionChainsModel) => {
          return response.length.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewIndependentCOTDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return TransmissionChainModel.canList(this.authUser) ?
            {
              link: ['/transmission-chains/list'],
              linkQueryParams: {
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_INDEPENDENT_TRANSMISSION_CHAINS_DESCRIPTION')
      },

      // Number of active chains of transmission
      {
        name: DashboardDashlet.ACTIVE_TRANSMISSION_CHAINS,
        group: DashboardKpiGroup.TRANSMISSION_CHAIN,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_ACTIVE_CHAINS',
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
            qb.filter.byEquality(
              'endDate',
              LocalizationHelper.toMoment(globalFilterDate).endOf('day').toISOString()
            );
          }

          // location
          if (globalFilterLocationId) {
            qb.addChildQueryBuilder('person').filter.where({
              or: [
                {
                  type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                  'address.parentLocationIdFilter': globalFilterLocationId
                }, {
                  type: {
                    inq: [
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                      'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                    ]
                  },
                  'addresses.parentLocationIdFilter': globalFilterLocationId
                }
              ]
            });
          }

          // discarded cases
          // handled by API
          // NOTHING to do here

          // classification
          if (globalFilterClassificationId?.length > 0) {
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
                    inq: globalFilterClassificationId
                  }
                }
              ]
            };

            // isolated classification
            qb.filter.where(classificationConditions);

            // person
            qb.addChildQueryBuilder('person').filter.where(classificationConditions);
          }

          // retrieve data
          return this.transmissionChainDataService
            .getCountIndependentTransmissionChains(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricIndependentTransmissionChainsModel) => {
          return response.activeChainsCount.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewActiveCOTDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return TransmissionChainModel.canList(this.authUser) ?
            {
              link: ['/transmission-chains/list'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_ACTIVE_CHAINS_DESCRIPTION')
      },

      // Number of new chains of transmission from registered contacts who have became cases
      {
        name: DashboardDashlet.TRANSMISSION_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES,
        group: DashboardKpiGroup.TRANSMISSION_CHAIN,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_NEW_CHAINS_OF_TRANSMISSION_FROM_REGISTERED_CONTACTS_WHO_BECAME_CASES',
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

          // location
          if (globalFilterLocationId) {
            qb.addChildQueryBuilder('case').filter
              .byEquality('addresses.parentLocationIdFilter', globalFilterLocationId);
          }

          // classification
          if (globalFilterClassificationId?.length > 0) {
            // person
            qb.addChildQueryBuilder('case').filter.where({
              classification: {
                inq: globalFilterClassificationId
              }
            });
          }

          // retrieve data
          return this.transmissionChainDataService
            .getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: MetricIndependentTransmissionChainsModel) => {
          return response.length.toLocaleString('en');
        },
        hasPermission: () => {
          return DashboardModel.canViewNewChainsFromContactsWhoBecameCasesDashlet(this.authUser);
        },
        getLink: (
          _inputValue,
          globalFilterDate,
          globalFilterLocationId,
          globalFilterClassificationId
        ) => {
          return TransmissionChainModel.canList(this.authUser) ?
            {
              link: ['/transmission-chains/list'],
              linkQueryParams: {
                applyListFilter: Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES,
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
        helpTooltip: this.i18nService.instant('LNG_PAGE_DASHBOARD_KPI_NEW_CHAINS_OF_TRANSMISSION_FROM_REGISTERED_CONTACTS_WHO_BECAME_CASES_DESCRIPTION')
      }
    ];

    // update ui
    this.detectChanges();
  }
}
