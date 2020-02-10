import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
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
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import * as _ from 'lodash';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-transmission-chains-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-list.component.html',
    styleUrls: ['./transmission-chains-list.component.less']
})
export class TransmissionChainsListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE', null, true)
    ];

    outbreakSubscriber: Subscription;

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of transmission chains
    transmissionChains$: Observable<TransmissionChainModel[]>;

    // provide constants to template
    Constants = Constants;
    TransmissionChainModel = TransmissionChainModel;

    EntityType = EntityType;

    queryParamsData: any;

    fixedTableColumns: string[] = [
        'firstContactDate',
        'rootCase',
        'noCases',
        'noAliveCases',
        'numberOfContacts',
        'duration',
        'active'
    ];

    /**
     * Constructor
     */
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

    /**
     * Component initialized
     */
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
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
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

                case ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
                    // date
                    qb = new RequestQueryBuilder();

                    // date
                    if (globalFilters.date) {
                        qb.filter.byDateRange(
                            'contactDate', {
                                endDate: globalFilters.date.endOf('day').toISOString()
                            }
                        );
                    }

                    // location
                    if (globalFilters.locationId) {
                        qb.addChildQueryBuilder('case').filter
                            .byEquality('addresses.parentLocationIdFilter', globalFilters.locationId);
                    }

                    // classification
                    if (!_.isEmpty(globalFilters.classificationId)) {
                        // person
                        qb.addChildQueryBuilder('case').filter.where({
                            classification: {
                                inq: globalFilters.classificationId
                            }
                        });
                    }

                    // finished
                    break;

                default:
                    // date
                    qb = new RequestQueryBuilder();

                    // date
                    if (globalFilters.date) {
                        qb.filter.byDateRange(
                            'contactDate', {
                                endDate: globalFilters.date.endOf('day').toISOString()
                            }
                        );
                    }

                    // location
                    if (globalFilters.locationId) {
                        qb.addChildQueryBuilder('person').filter.where({
                            or: [
                                {
                                    type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                                    'address.parentLocationIdFilter': globalFilters.locationId
                                }, {
                                    type: {
                                        inq: [
                                            'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                            'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                                        ]
                                    },
                                    'addresses.parentLocationIdFilter': globalFilters.locationId
                                }
                            ]
                        });
                    }

                    // classification
                    if (!_.isEmpty(globalFilters.classificationId)) {
                        // define classification conditions
                        const classificationConditions = {
                            or: [
                                {
                                    type: {
                                        neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                                    }
                                }, {
                                    type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                    classification: {
                                        inq: globalFilters.classificationId
                                    }
                                }
                            ]
                        };

                        // top level classification
                        qb.filter.where(classificationConditions);

                        // person
                        qb.addChildQueryBuilder('person').filter.where(classificationConditions);
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
    refreshList(finishCallback: (records: any[]) => void) {
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
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap((data: any[]) => {
                        finishCallback(data);
                    })
                );
        } else {
            finishCallback([]);
        }
    }
}
