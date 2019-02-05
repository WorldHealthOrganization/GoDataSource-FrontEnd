import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/chronology.component';
import 'rxjs/add/observable/forkJoin';
import { I18nService } from '../../../../core/services/helper/i18n.service';

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
    chronologyEntries: ChronologyItem[] = [];

    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private labResultDataService: LabResultDataService,
        private i18nService: I18nService
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
                            const chronologyEntries: ChronologyItem[] = [];

                            // date of onset
                            if (!_.isEmpty(this.caseData.dateOfOnset)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.caseData.dateOfOnset,
                                    label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET'
                                }));
                            }

                            // date of infection
                            if (!_.isEmpty(this.caseData.dateOfInfection)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.caseData.dateOfInfection,
                                    label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION'
                                }));
                            }

                            // date of outcome
                            if (!_.isEmpty(this.caseData.dateOfOutcome)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.caseData.dateOfOutcome,
                                    label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME'
                                }));
                            }

                            // date contact become case
                            if (!_.isEmpty(this.caseData.dateBecomeCase)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.caseData.dateBecomeCase,
                                    label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE'
                                }));
                            }

                            // hospitalization dates
                            _.forEach(this.caseData.hospitalizationDates, (hospitalization) => {
                                if (!_.isEmpty(hospitalization.startDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: hospitalization.startDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_HOSPITALISATION_START_DATE'
                                    }));
                                }
                                if (!_.isEmpty(hospitalization.endDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: hospitalization.endDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_HOSPITALISATION_END_DATE'
                                    }));
                                }
                            });

                            // incubation dates
                            _.forEach(this.caseData.incubationDates, (incubation) => {
                                if (!_.isEmpty(incubation.startDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: incubation.startDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_INCUBATION_START_DATE'
                                    }));
                                }
                                if (!_.isEmpty(incubation.endDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: incubation.endDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_INCUBATION_END_DATE'
                                    }));
                                }
                            });

                            // isolation dates
                            _.forEach(this.caseData.isolationDates, (isolation) => {
                                if (!_.isEmpty(isolation.startDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: isolation.startDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_ISOLATION_START_DATE'
                                    }));
                                }
                                if (!_.isEmpty(isolation.endDate)) {
                                    chronologyEntries.push(new ChronologyItem({
                                        date: isolation.endDate,
                                        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_ISOLATION_END_DATE'
                                    }));
                                }
                            });

                            // classification dates
                            if (!_.isEmpty(this.caseData.classificationHistory)) {
                                _.forEach(
                                    this.caseData.classificationHistory, (
                                        classificationHistory: {
                                            classification: string,
                                            startDate: string,
                                            endDate: string
                                        }
                                    ) => {
                                        const translateData = {
                                            classification: this.i18nService.instant(classificationHistory.classification)
                                        };
                                        if (!_.isEmpty(classificationHistory.startDate)) {
                                            chronologyEntries.push(new ChronologyItem({
                                                date: classificationHistory.startDate,
                                                label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_CLASSIFICATION_HISTORY_START_DATE',
                                                translateData: translateData
                                            }));
                                        }
                                        if (!_.isEmpty(classificationHistory.endDate)) {
                                            chronologyEntries.push(new ChronologyItem({
                                                date: classificationHistory.endDate,
                                                label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_CLASSIFICATION_HISTORY_END_DATE',
                                                translateData: translateData
                                            }));
                                        }
                                    });
                            }

                            // lab sample taken and lab result dates
                            this.labResultDataService
                                .getCaseLabResults(selectedOutbreak.id, this.caseData.id)
                                .subscribe((labResults) => {
                                    // isolation dates
                                    _.forEach(labResults, (labResult) => {
                                        if (!_.isEmpty(labResult.dateOfResult)) {
                                            chronologyEntries.push(new ChronologyItem({
                                                date: labResult.dateOfResult,
                                                label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_LAB_RESULT_DATE'
                                            }));
                                        }
                                    });

                                    // set data
                                    this.chronologyEntries = chronologyEntries;
                                });
                        });
                });
        });
    }
}
