import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { PERMISSION } from '../../../../core/models/permission.model';
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
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-report-cases-date-onset-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-cases-date-onset-list.component.html',
    styleUrls: ['./report-cases-date-onset-list.component.less']
})
export class ReportCasesDateOnsetListComponent extends ListComponent implements OnInit, OnDestroy {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE', '', true)
    ];

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
                    }
                }),

                // View relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW_RELATIONSHIP',
                    click: (item: ReportCasesWithOnsetModel) => {
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.relationship.persons, { id: item.primaryCase.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.primaryCase.id, relationTypePath, item.relationship.id, 'view']);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER
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
                        return this.hasCaseWriteAccess() &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
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
                        return this.hasCaseWriteAccess() &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
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
                        return this.hasCaseWriteAccess() &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
                    }
                })
            ]
        })
    ];

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
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: () => void) {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.casesWithOnsetList$ = this.relationshipDataService.getCasesWithDateOnsetBeforePrimaryCase(this.selectedOutbreak.id)
                .pipe(
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'primaryCase.firstName',
            'primaryCase.lastName',
            'primaryCase.dateOfOnset',
            'primaryCase.classification',
            'secondaryCase.firstName',
            'secondaryCase.lastName',
            'secondaryCase.dateOfOnset',
            'secondaryCase.classification'
        ];
    }
}
