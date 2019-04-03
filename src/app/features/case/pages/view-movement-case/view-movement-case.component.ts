import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { forkJoin } from 'rxjs';
import { WorldMapMovementComponent } from '../../../../shared/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';

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
    movementAddresses: AddressModel[] = [];

    @ViewChild('mapMovement') mapMovement: WorldMapMovementComponent;

    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {
    }

    ngOnInit() {
        this.route.params.subscribe((params: { caseId }) => {
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    forkJoin(
                        this.caseDataService.getCase(selectedOutbreak.id, params.caseId),
                        this.caseDataService.getCaseMovement(selectedOutbreak.id, params.caseId)
                    )
                        .subscribe((
                            [caseData, movementData]: [CaseModel, AddressModel[]]
                        ) => {
                            // case data
                            this.caseData = caseData;
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    this.caseData.name,
                                    `/cases/${this.caseData.id}/view`),
                                new BreadcrumbItemModel(
                                    'LNG_PAGE_VIEW_MOVEMENT_CASE_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.caseData
                                )
                            );

                            // movement data
                            this.movementAddresses = movementData;
                        });
                });
        });
    }

    /**
     * Export case movement map
     */
    exportCaseMovementMap() {
        this.mapMovement.exportMovementMap(EntityType.CASE);
    }
}
