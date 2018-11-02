import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { MetricLocationCasesCountsModel } from '../../../../core/models/metrics/metric-location-cases-count.model';

@Component({
    selector: 'app-case-by-geographic-location-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-by-geographic-location-dashlet.component.html',
    styleUrls: ['./case-by-geographic-location-dashlet.component.less']
})
export class CasesByGeographicLocationDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    casesLocationResults: any = [];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for hospitalised cases
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getCasesPerLocation(selectedOutbreak.id)
                        .subscribe((locationsMetric) => {
                            this.casesLocationResults = this.buildChartData(locationsMetric.locations);
                        });
                }
            });
    }

    /**
     * Build chart data object
     * @param {MetricLocationCasesCountsModel[]} locationsMetric
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(locationsMetric: MetricLocationCasesCountsModel[]) {
        const caseLocationSummaryResults: MetricChartDataModel[] = [];
        _.forEach(locationsMetric, (locationMetric, key) => {
            if (locationMetric.casesCount > 0) {
                const caseLocationSummaryResult: MetricChartDataModel = new MetricChartDataModel();
                caseLocationSummaryResult.name = locationMetric.location.name;
                caseLocationSummaryResult.value = locationMetric.casesCount;
                caseLocationSummaryResults.push(caseLocationSummaryResult);
            }
        });
        return caseLocationSummaryResults;
    }

}
