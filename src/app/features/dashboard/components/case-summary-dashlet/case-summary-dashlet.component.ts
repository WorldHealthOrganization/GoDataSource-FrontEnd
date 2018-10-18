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
    selector: 'app-case-summary-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-summary-dashlet.component.html',
    styleUrls: ['./case-summary-dashlet.component.less']
})
export class CaseSummaryDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    caseClassificationsList: ReferenceDataCategoryModel;
    caseSummaryResults: any = [];
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
                        .getCasesList(selectedOutbreak.id)
                        .subscribe((casesList) => {
                            this.caseSummaryResults = this.buildChartData(casesList);
                        });
                }
            });
    }

    /**
     * Build chart data object
     * @param {CaseModel[]} casesList
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(casesList: CaseModel[]) {
        let caseSummaryResults: MetricChartDataModel[] = [];
        _.forEach(casesList, (casePerson, key) => {
            // ignore not a case classification
            if (casePerson.classification !== Constants.CASE_CLASSIFICATION.NOT_A_CASE) {
                const caseSummaryResult: MetricChartDataModel = _.find(caseSummaryResults, {name: casePerson.classification});
                if (caseSummaryResult) {
                    caseSummaryResult.value++;
                } else {
                    const caseSummaryResultNew: MetricChartDataModel = new MetricChartDataModel();
                    caseSummaryResultNew.name = casePerson.classification;
                    caseSummaryResultNew.value = 1;
                    caseSummaryResults.push(caseSummaryResultNew);
                }
            }
        });
        // translate the classification
        caseSummaryResults.map((result) => {
            result.name = this.i18nService.instant(result.name);
            return result;
        });
        caseSummaryResults = _.orderBy(caseSummaryResults, ['value'], ['desc']);
        return caseSummaryResults;
    }

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
