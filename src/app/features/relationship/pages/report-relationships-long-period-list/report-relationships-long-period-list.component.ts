import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { tap } from 'rxjs/operators';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ReportDifferenceOnsetRelationshipModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-report-relationships-long-period',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-relationships-long-period-list.component.html',
    styleUrls: ['./report-relationships-long-period-list.component.less']
})
export class ReportRelationshipsLongPeriodListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE', '', true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
    relationshipList$: Observable<ReportDifferenceOnsetRelationshipModel[]>;

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
                    }
                }),

                // View relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW_RELATIONSHIP',
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'view']);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER
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
                        return this.hasCaseWriteAccess() &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
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
                        return this.hasCaseWriteAccess() &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
                    }
                }),

                // Modify relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY_RELATIONSHIP',
                    click: (item: ReportDifferenceOnsetRelationshipModel) => {
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        // #TODO TBD - if this is correct !?
                        const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                        this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'modify']);
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
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // refresh
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: () => void) {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.relationshipList$ = this.relationshipDataService
                .getLongPeriodBetweenDateOfOnset(this.selectedOutbreak.id)
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
            'people[0].firstName',
            'people[0].lastName',
            'people[0].dateOfOnset',
            'people[1].firstName',
            'people[1].lastName',
            'people[1].dateOfOnset',
            'differenceBetweenDatesOfOnset'
        ];
    }
}
