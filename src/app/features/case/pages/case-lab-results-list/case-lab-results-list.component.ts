import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { Observable } from 'rxjs/Observable';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { Constants } from '../../../../core/models/constants';
import * as moment from 'moment';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';

@Component({
    selector: 'app-case-lab-results-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-lab-results-list.component.html',
    styleUrls: ['./case-lab-results-list.component.less']
})
export class CaseLabResultsListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    // case
    caseData: CaseModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of existing case lab results
    labResultsList$: Observable<LabResultModel[]>;

    // constants
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private labResultDataService: LabResultDataService
    ) {
        super();
    }

    ngOnInit() {
        // retrieve case information
        this.route.params.subscribe(params => {
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // selected outbreak
                    this.selectedOutbreak = selectedOutbreak;

                    // get case data
                    this.caseDataService
                        .getCase(this.selectedOutbreak.id, params.caseId)
                        .subscribe((caseData: CaseModel) => {
                            this.caseData = caseData;

                            // setup breadcrumbs
                            this.breadcrumbs.push(new BreadcrumbItemModel(this.caseData.name, `/cases/${this.caseData.id}/modify`));
                            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE', '.', true));

                            // retrieve lab data
                            this.refreshList();
                    });
                });
        });
    }

    /**
     * Re(load) the Case lab results list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (
            this.selectedOutbreak &&
            this.caseData &&
            this.caseData.id
        ) {
            // display only unresolved followups
            this.queryBuilder.filter.where({
                dateOfResult: {
                    lte: moment()
                }
            }, true);

            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService.getCaseLabResults(this.selectedOutbreak.id, this.caseData.id, this.queryBuilder);
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'id',
            'dateSampleTaken',
            'dateSampleDelivered',
            'dateOfResult',
            'labName',
            'sampleType',
            'testType',
            'result'
        ];
    }
}
