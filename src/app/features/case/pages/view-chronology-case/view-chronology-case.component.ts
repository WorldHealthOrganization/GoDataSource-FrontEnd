import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';

@Component({
    selector: 'app-view-chronology-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-chronology-case.component.html',
    styleUrls: ['./view-chronology-case.component.less']
})
export class ViewChronologyCaseComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
    ];

    caseData: CaseModel = new CaseModel();
    chronologyEntries: any[] = [];

    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private labResultDataService: LabResultDataService
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params: { caseId }) => {
            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // get case
                    this.caseDataService
                        .getCase(selectedOutbreak.id, params.caseId)
                        .subscribe((caseDataReturned) => {
                            this.caseData = caseDataReturned;
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    caseDataReturned.name,
                                    `/cases/${caseDataReturned.id}/view`),
                                new BreadcrumbItemModel(
                                    'LNG_PAGE_VIEW_CHRONOLOGY_CASE_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.caseData
                                )
                            );

                            // create entries array.
                            // date of onset
                            if (!_.isEmpty(this.caseData.dateOfOnset)) {
                                this.chronologyEntries.push({date: this.caseData.dateOfOnset, label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET'});
                            }
                            // date of infection
                            if (!_.isEmpty(this.caseData.dateOfInfection)) {
                                this.chronologyEntries.push({date: this.caseData.dateOfInfection, label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION'});
                            }
                            // date of outcome
                            if (!_.isEmpty(this.caseData.dateOfOutcome)) {
                                this.chronologyEntries.push({date: this.caseData.dateOfOutcome, label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME'});
                            }
                            // date deceased
                            if (!_.isEmpty(this.caseData.dateDeceased)) {
                                this.chronologyEntries.push({date: this.caseData.dateDeceased, label: 'LNG_CASE_FIELD_LABEL_DATE_DECEASED'});
                            }
                            // date contact become case
                            if (!_.isEmpty(this.caseData.dateBecomeCase)) {
                                this.chronologyEntries.push({date: this.caseData.dateBecomeCase, label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE'});
                            }
                            // hospitalization dates
                            _.forEach(this.caseData.hospitalizationDates, (hospitalization, key) => {
                                if (!_.isEmpty(hospitalization.startDate)) {
                                    this.chronologyEntries.push({date: hospitalization.startDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_HOSPITALISATION_START_DATE'});
                                }
                                if (!_.isEmpty(hospitalization.endDate)) {
                                    this.chronologyEntries.push({date: hospitalization.endDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_HOSPITALISATION_END_DATE'});
                                }
                            });
                            // incubation dates
                            _.forEach(this.caseData.incubationDates, (incubation, key) => {
                                if (!_.isEmpty(incubation.startDate)) {
                                    this.chronologyEntries.push({date: incubation.startDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_INCUBATION_START_DATE'});
                                }
                                if (!_.isEmpty(incubation.endDate)) {
                                    this.chronologyEntries.push({date: incubation.endDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_INCUBATION_END_DATE'});
                                }
                            });
                            // isolation dates
                            _.forEach(this.caseData.isolationDates, (isolation, key) => {
                                if (!_.isEmpty(isolation.startDate)) {
                                    this.chronologyEntries.push({date: isolation.startDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_ISOLATION_START_DATE'});
                                }
                                if (!_.isEmpty(isolation.endDate)) {
                                    this.chronologyEntries.push({date: isolation.endDate, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_ISOLATION_END_DATE'});
                                }
                            });
                            // lab sample taken and lab result dates
                            this.labResultDataService.getCaseLabResults(selectedOutbreak.id, this.caseData.id).subscribe((labResults) => {
                                // isolation dates
                                _.forEach(labResults, (labResult, key) => {
                                    if (!_.isEmpty(labResult.dateOfResult)) {
                                        this.chronologyEntries.push({date: labResult.dateOfResult, label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_LAB_RESULT_DATE'});
                                    }
                                });
                                // sort collection asc
                                this.chronologyEntries = _.sortBy(this.chronologyEntries, 'date');
                            });
                            // sort collection asc
                            this.chronologyEntries = _.sortBy(this.chronologyEntries, 'date');
                        });
                });
        });
    }
}
