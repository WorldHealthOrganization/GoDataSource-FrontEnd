import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

@Component({
    selector: 'app-view-movement-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-movement-case.component.html',
    styleUrls: ['./view-movement-case.component.less']
})
export class ViewMovementCaseComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
    ];

    caseData: CaseModel = new CaseModel();

    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
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
                                    'LNG_PAGE_VIEW_MOVEMENT_CASE_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.caseData
                                )
                            );
                        });
                });


        });
    }
}
