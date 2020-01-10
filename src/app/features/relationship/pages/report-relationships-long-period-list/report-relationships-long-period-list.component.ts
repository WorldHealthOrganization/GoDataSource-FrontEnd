import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { RelationshipModel, ReportDifferenceOnsetRelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { throwError } from 'rxjs/internal/observable/throwError';
import { CaseModel } from '../../../../core/models/case.model';

@Component({
    selector: 'app-report-relationships-long-period',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-relationships-long-period-list.component.html',
    styleUrls: ['./report-relationships-long-period-list.component.less']
})
export class ReportRelationshipsLongPeriodListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    outbreakSubscriber: Subscription;

    // list of long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
    relationshipList$: Observable<ReportDifferenceOnsetRelationshipModel[]>;

    fixedTableColumns: string[] = [
        'people[0].firstName',
        'people[0].lastName',
        'people[0].dateOfOnset',
        'people[1].firstName',
        'people[1].lastName',
        'people[1].dateOfOnset',
        'differenceBetweenDatesOfOnset'
    ];

    recordActions: HoverRowAction[] = [
        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // View people 1
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
                    menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
                        return item.people[0].model;
                    },
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        this.router.navigate(['/cases', item.people[0].model.id, 'view'], {
                            queryParams: {
                                longPeriod: true
                            }
                        });
                    },
                    visible: () => {
                        return CaseModel.canView(this.authUser);
                    }
                }),

                // View people 2
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
                    menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
                        return item.people[1].model;
                    },
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        this.router.navigate(['/cases', item.people[1].model.id, 'view'], {
                            queryParams: {
                                longPeriod: true
                            }
                        });
                    },
                    visible: () => {
                        return CaseModel.canView(this.authUser);
                    }
                }),

                // View relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW_RELATIONSHIP',
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'view']);
                    },
                    visible: () => {
                        return RelationshipModel.canView(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: () => {
                        return CaseModel.canView(this.authUser) ||
                            RelationshipModel.canView(this.authUser);
                    }
                }),

                // Modify people 1
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
                    menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
                        return item.people[0].model;
                    },
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        this.router.navigate(['/cases', item.people[0].model.id, 'modify'], {
                            queryParams: {
                                longPeriod: true
                            }
                        });
                    },
                    visible: () => {
                        return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canModify(this.authUser);
                    }
                }),

                // Modify people 2
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
                    menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
                        return item.people[1].model;
                    },
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        this.router.navigate(['/cases', item.people[1].model.id, 'modify'], {
                            queryParams: {
                                longPeriod: true
                            }
                        });
                    },
                    visible: () => {
                        return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canModify(this.authUser);
                    }
                }),

                // Modify relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY_RELATIONSHIP',
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'modify']);
                    },
                    visible: () => {
                        return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            RelationshipModel.canModify(this.authUser);
                    }
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private relationshipDataService: RelationshipDataService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // refresh
                this.needsRefreshList(true);
            });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
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
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // cases list
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE', '', true)
        );
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.relationshipList$ = this.relationshipDataService
                .getLongPeriodBetweenDateOfOnset(this.selectedOutbreak.id)
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
