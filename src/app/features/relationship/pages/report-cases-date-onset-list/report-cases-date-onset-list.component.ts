import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { ReportCasesWithOnsetModel } from '../../../../core/models/report-cases-with-onset.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';
import { throwError } from 'rxjs/internal/observable/throwError';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-report-cases-date-onset-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-cases-date-onset-list.component.html',
    styleUrls: ['./report-cases-date-onset-list.component.less']
})
export class ReportCasesDateOnsetListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    outbreakSubscriber: Subscription;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of secondary cases with onset date that is before the date of onset of the primary case
    casesWithOnsetList$: Observable<ReportCasesWithOnsetModel[]>;

    // provide constants to template
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    fixedTableColumns: string[] = [
        'primaryCase.firstName',
        'primaryCase.lastName',
        'primaryCase.dateOfOnset',
        'primaryCase.classification',
        'secondaryCase.firstName',
        'secondaryCase.lastName',
        'secondaryCase.dateOfOnset',
        'secondaryCase.classification'
    ];

    recordActions: HoverRowAction[] = [
        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // View people 1
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW',
                    menuOptionLabelTranslateData: (item: ReportCasesWithOnsetModel) => {
                        return item.primaryCase;
                    },
                    click: (item: ReportCasesWithOnsetModel) => {
                        this.router.navigate(['/cases', item.primaryCase.id, 'view'], {
                            queryParams: {
                                onset: true
                            }
                        });
                    },
                    visible: () => {
                        return CaseModel.canView(this.authUser);
                    }
                }),

                // View people 2
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW',
                    menuOptionLabelTranslateData: (item: ReportCasesWithOnsetModel) => {
                        return item.secondaryCase;
                    },
                    click: (item: ReportCasesWithOnsetModel) => {
                        this.router.navigate(['/cases', item.secondaryCase.id, 'view'], {
                            queryParams: {
                                onset: true
                            }
                        });
                    },
                    visible: () => {
                        return CaseModel.canView(this.authUser);
                    }
                }),

                // View relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW_RELATIONSHIP',
                    click: (item: ReportCasesWithOnsetModel) => {
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.relationship.persons, { id: item.primaryCase.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.primaryCase.id, relationTypePath, item.relationship.id, 'view']);
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
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY',
                    menuOptionLabelTranslateData: (item: ReportCasesWithOnsetModel) => {
                        return item.primaryCase;
                    },
                    click: (item: ReportCasesWithOnsetModel) => {
                        this.router.navigate(['/cases', item.primaryCase.id, 'modify'], {
                            queryParams: {
                                onset: true
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
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY',
                    menuOptionLabelTranslateData: (item: ReportCasesWithOnsetModel) => {
                        return item.secondaryCase;
                    },
                    click: (item: ReportCasesWithOnsetModel) => {
                        this.router.navigate(['/cases', item.secondaryCase.id, 'modify'], {
                            queryParams: {
                                onset: true
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
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY_RELATIONSHIP',
                    click: (item: ReportCasesWithOnsetModel) => {
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.relationship.persons, { id: item.primaryCase.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.primaryCase.id, relationTypePath, item.relationship.id, 'modify']);
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
            new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE', '', true)
        );
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.casesWithOnsetList$ = this.relationshipDataService
                .getCasesWithDateOnsetBeforePrimaryCase(this.selectedOutbreak.id)
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
