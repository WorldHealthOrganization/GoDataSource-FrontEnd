import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-cases-hospitalized-pie-chart-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalized-pie-chart-dashlet.component.html',
    styleUrls: ['./cases-hospitalized-pie-chart-dashlet.component.less']
})
export class CasesHospitalizedPieChartDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    caseClassificationsList: ReferenceDataCategoryModel;
    caseListCount: number = 0;
    caseHospitalizationCount: number = 0;
    caseIsolationCount: number = 0;
    caseHospitalizationSummaryResults: any = [];
    customColors = [];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
            .subscribe((caseClassifications) => {
                this.caseClassificationsList = caseClassifications;
                this.setCustomColors();
            });

        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for hospitalised cases
                if (selectedOutbreak && selectedOutbreak.id) {

                    this.caseDataService
                        .getHospitalisedCasesCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.caseHospitalizationCount = result.count;
                            this.caseHospitalizationSummaryResults = this.buildChartData();
                        });

                    this.caseDataService
                        .getIsolatedCasesCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.caseIsolationCount = result.count;
                            this.caseHospitalizationSummaryResults = this.buildChartData();
                        });

                    this.caseDataService
                        .getCasesCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.caseListCount = result.count;
                            this.caseHospitalizationSummaryResults = this.buildChartData();
                        });

                }
            });
    }

    /**
     * Build chart data object
     * @returns {MetricChartDataModel[]}
     */
    buildChartData() {
        let caseHospitalizationSummaryResults: MetricChartDataModel[] = [];
        caseHospitalizationSummaryResults.push({value: this.caseHospitalizationCount, name: 'Cases Hospitalized'});
        caseHospitalizationSummaryResults.push({value: this.caseIsolationCount, name: 'Cases Isolated'});
        const caseNotHospitalized = this.caseListCount - this.caseHospitalizationCount - this.caseIsolationCount;
        caseHospitalizationSummaryResults.push({value: caseNotHospitalized, name: 'Cases Not Hospitalized'});

        caseHospitalizationSummaryResults = _.orderBy(caseHospitalizationSummaryResults, ['value'], ['desc']);
        return caseHospitalizationSummaryResults;
    }

    /**
     * Set custom colors of the chart - based on those chosen in ref data
     */
    setCustomColors() {
        const customColors = [];
        if (!_.isEmpty(this.caseClassificationsList)) {
            _.forEach(this.caseClassificationsList.entries, (entry, key) => {
                const customColor: MetricChartDataModel = new MetricChartDataModel();
                customColor.name = this.i18nService.instant(entry.value);
                customColor.value = entry.colorCode;
                customColors.push(customColor);
            });
            this.customColors = customColors;
        }
    }

}
