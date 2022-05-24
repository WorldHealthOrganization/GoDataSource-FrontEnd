import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { MetricCasesWithContactsModel } from '../../../../core/models/metrics/metric-cases-contacts.model';
import { Constants } from '../../../../core/models/constants';
import { moment } from '../../../../core/helperClasses/x-moment';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { CaseModel } from '../../../../core/models/case.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cases-kpi-dashlet',
  templateUrl: './app-cases-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCasesKpiDashletComponent
  extends AppDashletV2 implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private caseDataService: CaseDataService,
    private relationshipDataService: RelationshipDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
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
                endDate: moment(globalFilterDate).endOf('day').format()
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

          // retrieve deceased cases
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
        helpTooltip: this.translateService.instant('LNG_PAGE_DASHBOARD_KPI_CASES_DECEASED_TITLE_DESCRIPTION')
      },

      // Cases hospitalised
      {
        name: DashboardDashlet.CASES_HOSPITALISED,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_HOSPITALISED_TITLE',
        refresh: () => {
          // filter
          const qb = new RequestQueryBuilder();

          // retrieve cases currently hospitalized
          return this.caseDataService
            .getHospitalisedCasesCount(
              this.selectedOutbreak.id,
              undefined,
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
          _globalFilterDate,
          _globalFilterLocationId,
          _globalFilterClassificationId
        ) => {
          return undefined;
        },
        helpTooltip: ''
      },

      // Cases with Less than x Contacts
      {
        name: DashboardDashlet.CASES_WITH_LESS_THAN_X_CONTACTS,
        group: DashboardKpiGroup.CASE,
        valueColor,
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_BEFORE_VALUE',
        suffix: 'LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_AFTER_VALUE',
        inputValue: this.selectedOutbreak.noLessContacts,
        refresh: (inputValue) => {
          // filter
          const qb = new RequestQueryBuilder();

          // change the way we build query
          qb.filter.firstLevelConditions();

          // convert noLessContacts to number as the API expects
          if (inputValue) {
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
          _inputValue,
          _globalFilterDate,
          _globalFilterLocationId,
          _globalFilterClassificationId
        ) => {
          return undefined;
        },
        helpTooltip: undefined
      }
    ];

    // update ui
    this.detectChanges();
  }
}
