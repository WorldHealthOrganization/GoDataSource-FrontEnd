import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AppDashletV2 } from '../../helperClasses/app-dashlet-v2';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { MetricCasesWithContactsModel } from '../../../../core/models/metrics/metric-cases-contacts.model';

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
    outbreakDataService: OutbreakDataService
  ) {
    super(outbreakDataService);
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
    this.values = [
      // Cases who have died
      {
        prefix: 'LNG_PAGE_DASHBOARD_KPI_CASES_DECEASED_TITLE',
        refresh: () => {
          // filter
          const qb = new RequestQueryBuilder();

          // retrieve deceased cases
          return this.caseDataService
            .getDeceasedCasesCount(
              this.selectedOutbreak.id,
              qb
            );
        },
        process: (response: { count: number }) => {
          return response.count.toLocaleString('en');
        }
      },

      // Cases hospitalised
      {
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
        }
      },

      // Cases with Less than x Contacts
      {
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
        }
      }
    ];

    // update ui
    this.detectChanges();
  }
}
