import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';

import { I18nService } from '../../../../core/services/helper/i18n.service';
import { CaseChronology } from './typings/case-chronology';
import { forkJoin } from 'rxjs/index';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';

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
        private i18nService: I18nService,
        private relationshipDataService: RelationshipDataService
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
                            forkJoin(
                                // get relationships
                                this.relationshipDataService
                                    .getEntityRelationships(
                                        selectedOutbreak.id,
                                        this.caseData.type,
                                        this.caseData.id
                                    ),
                                // lab sample taken and lab result dates
                                this.labResultDataService
                                    .getCaseLabResults(selectedOutbreak.id, this.caseData.id)
                            ).subscribe(([relationshipData, labResults]: [RelationshipModel[], LabResultModel[]]) => {
                                // set data
                                this.chronologyEntries = CaseChronology.getChronologyEntries(this.i18nService, this.caseData, labResults, relationshipData);
                            });
                        });
                });
        });
    }
}
