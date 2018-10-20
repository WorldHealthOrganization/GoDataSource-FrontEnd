import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import 'rxjs/add/observable/forkJoin';

@Component({
    selector: 'app-cases-hospitalized-pie-chart-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalized-pie-chart-dashlet.component.html',
    styleUrls: ['./cases-hospitalized-pie-chart-dashlet.component.less']
})
export class CasesHospitalizedPieChartDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    caseListCount: number = 0;
    caseHospitalizationCount: number = 0;
    caseIsolationCount: number = 0;
    caseHospitalizationSummaryResults: any = [];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService,
        protected snackbarService: SnackbarService
    ) {}

    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                 if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    // get data
                    this.initializeData();
                }
            });
    }

    /**
     * get necessary data
     */
    initializeData() {
        Observable.forkJoin([
            this.caseDataService
                .getHospitalisedCasesCount(this.selectedOutbreak.id),
            this.caseDataService
                .getIsolatedCasesCount(this.selectedOutbreak.id),
            this.caseDataService
                .getCasesCount(this.selectedOutbreak.id)
        ]).catch((err) => {
            this.snackbarService.showError(err.message);
            return ErrorObservable.create(err);
        }).subscribe(([hospitalizedCountResults, isolatedCountResults, casesCountResults]) => {
            this.caseHospitalizationCount = hospitalizedCountResults.count;
            this.caseIsolationCount = isolatedCountResults.count;
            this.caseListCount = casesCountResults.count;
            this.caseHospitalizationSummaryResults = this.buildChartData();
        });

    }

    /**
     * Build chart data object
     * @returns {MetricChartDataModel[]}
     */
    buildChartData() {
        const caseHospitalizationSummaryResults: MetricChartDataModel[] = [];
        caseHospitalizationSummaryResults.push({value: this.caseHospitalizationCount, name: 'Cases Hospitalized'});
        caseHospitalizationSummaryResults.push({value: this.caseIsolationCount, name: 'Cases Isolated'});
        const caseNotHospitalized = this.caseListCount - this.caseHospitalizationCount - this.caseIsolationCount;
        caseHospitalizationSummaryResults.push({value: caseNotHospitalized, name: 'Cases Not Hospitalized'});
        return caseHospitalizationSummaryResults;
    }

}
