import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-transmission-chains-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-graph.component.html',
    styleUrls: ['./transmission-chains-graph.component.less']
})
export class TransmissionChainsGraphComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', null, true)
    ];

    // provide constants to template
    Constants = Constants;

    // authenticated user
    authUser: UserModel;
    // filter used for size of chains
    sizeOfChainsFilter: number = null;
    // person Id - to filter the chain
    personId: string = null;
    // type of the selected person . event
    selectedEntityType: EntityType = null;

    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        protected route: ActivatedRoute
    ) {}

    ngOnInit() {
        // get authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.queryParams
            .subscribe((params: {personId: string, selectedEntityType: EntityType, sizeOfChainsFilter: number}) => {
                // check if person id was sent in url
                if (params.personId && params.selectedEntityType) {
                    this.personId = params.personId;
                    this.selectedEntityType = params.selectedEntityType;
                }
                // check if the size of chains was sent in url
                if (params.sizeOfChainsFilter) {
                    this.sizeOfChainsFilter = params.sizeOfChainsFilter;
                }
            });
    }

    /**
     * Check if the user has read access to cases
     * @returns {boolean}
     */
    hasReadCasePermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Check if the user has read report permission
     * @returns {boolean}
     */
    hasReadReportPermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_REPORT);
    }

}
