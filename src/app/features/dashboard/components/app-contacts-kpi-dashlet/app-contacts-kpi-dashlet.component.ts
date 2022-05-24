import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { moment } from '../../../../core/helperClasses/x-moment';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { TranslateService } from '@ngx-translate/core';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { MetricContactsPerCaseModel } from '../../../../core/models/metrics/metric-contacts-per-case.model';

@Component({
  selector: 'app-contacts-kpi-dashlet',
  templateUrl: './app-contacts-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppContactsKpiDashletComponent
  extends AppDashletV2 implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private relationshipDataService: RelationshipDataService,
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
                endDate: moment(globalFilterDate).endOf('day').format()
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

          // retrieve deceased cases
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
        helpTooltip: this.translateService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEAN_TITLE_DESCRIPTION')
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
                endDate: moment(globalFilterDate).endOf('day').format()
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

          // retrieve deceased cases
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
        helpTooltip: this.translateService.instant('LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEDIAN_TITLE_DESCRIPTION')
      }
    ];

    // update ui
    this.detectChanges();
  }
}
