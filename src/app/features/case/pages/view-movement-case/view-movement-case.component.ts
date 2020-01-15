import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { forkJoin } from 'rxjs';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
    selector: 'app-view-movement-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-movement-case.component.html',
    styleUrls: ['./view-movement-case.component.less']
})
export class ViewMovementCaseComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    CaseModel = CaseModel;

    caseData: CaseModel = new CaseModel();
    movementAddresses: AddressModel[] = [];

    @ViewChild('mapMovement') mapMovement: WorldMapMovementComponent;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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

                            // initialize page breadcrumbs
                            this.initializeBreadcrumbs();

                            // movement data
                            this.movementAddresses = movementData;
                        });
                });
        });

        // initialize page breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // case list page
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // case breadcrumbs
        if (this.caseData) {
            // case view page
            if (CaseModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.caseData.name,
                        `/cases/${this.caseData.id}/view`
                    )
                );
            }

            // current page
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_VIEW_MOVEMENT_CASE_TITLE',
                    '.',
                    true,
                    {},
                    this.caseData
                )
            );
        }
    }

    /**
     * Export case movement map
     */
    exportCaseMovementMap() {
        this.mapMovement.exportMovementMap(EntityType.CASE);
    }
}
