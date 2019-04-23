import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { EntityType } from '../../../../core/models/entity-type';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-transmission-chains-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-list.component.html',
    styleUrls: ['./transmission-chains-list.component.less']
})
export class TransmissionChainsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', '/transmission-chains'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE', null, true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of transmission chains
    transmissionChains$: Observable<TransmissionChainModel[]>;

    // provide constants to template
    Constants = Constants;

    EntityType = EntityType;

    queryParamsData: any;

    constructor(
        private router: Router,
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private route: ActivatedRoute,
        protected snackbarService: SnackbarService,
        protected listFilterDataService: ListFilterDataService,
        private authDataService: AuthDataService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get query params
        this.route.queryParams
            .subscribe((queryParams: any) => {
                this.queryParamsData = queryParams;
                this.appliedListFilter = queryParams.applyListFilter;

                // init filters
                this.resetFiltersAddDefault();
            });

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });
    }

    /**
     * Initialize filters
     */
    resetFiltersAddDefault() {
        // get global filter values
        if (this.queryParamsData) {
            // get global filters
            const globalFilters = this.getGlobalFilterValues(this.queryParamsData);

            // generate query builder
            let qb: RequestQueryBuilder;
            switch (this.appliedListFilter) {
                case ApplyListFilter.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
                    // NOTHING - IGNORE
                    break;

                // case ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
                default:
                    // date
                    qb = new RequestQueryBuilder();

                    // date
                    if (globalFilters.date) {
                        qb.filter.byDateRange(
                            'contactDate', {
                                endDate: globalFilters.date.endOf('day').format()
                            }
                        );
                    }

                    // location
                    if (globalFilters.locationId) {
                        qb.include('people').queryBuilder.filter
                            .byEquality('type', EntityType.CASE)
                            .byEquality('addresses.parentLocationIdFilter', globalFilters.locationId);
                    }
            }

            // merge
            if (qb) {
                this.queryBuilder.merge(qb);
            }
        }
    }

    /**
     * Re(load) the Transmission Chains list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            if (this.appliedListFilter === ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES) {
                this.transmissionChains$ = this.transmissionChainDataService.getTransmissionChainsFromContactsWhoBecameCasesList(this.selectedOutbreak.id, this.queryBuilder);
            } else {
                const qb = new RequestQueryBuilder();

                qb.filter.flag(
                    'countContacts',
                    true
                );

                qb.merge(this.queryBuilder);

                this.transmissionChains$ = this.transmissionChainDataService.getIndependentTransmissionChainsList(this.selectedOutbreak.id, qb);
            }

            this.transmissionChains$ = this.transmissionChains$
                .pipe(tap(this.checkEmptyList.bind(this)));
        }
    }

    hasCaseReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'firstContactDate',
            'noCases',
            'noAliveCases',
            'numberOfContacts',
            'duration',
            'active'
        ];

        if (this.hasCaseReadAccess()) {
            // include the Root Case column on the second position
            columns.splice(1, 0, 'rootCase');
        }

        return columns;
    }
}
