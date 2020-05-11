import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-team-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './team-list.component.html',
    styleUrls: ['./team-list.component.less']
})
export class TeamListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_TEAMS_TITLE',
            '/teams'
        )
    ];

    outbreakSubscriber: Subscription;

    // constants
    TeamModel = TeamModel;

    // list of teams
    teamsList$: Observable<TeamModel[]>;
    teamsListCount$: Observable<IBasicCount>;

    // authenticated user
    authUser: UserModel;
    // selected outbreak - needed to check assignment at delete team
    selectedOutbreak: OutbreakModel;

    fixedTableColumns: string[] = [
        'name',
        'users',
        'locations'
    ];

    recordActions: HoverRowAction[] = [
        // View Team
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_TEAMS_ACTION_VIEW_TEAM',
            click: (item: TeamModel) => {
                this.router.navigate(['/teams', item.id, 'view']);
            },
            visible: (): boolean => {
                return TeamModel.canView(this.authUser);
            }
        }),

        // Modify Team
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_TEAMS_ACTION_MODIFY_TEAM',
            click: (item: TeamModel) => {
                this.router.navigate(['/teams', item.id, 'modify']);
            },
            visible: (): boolean => {
                return TeamModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Team
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM',
                    click: (item: TeamModel) => {
                        this.deleteTeam(item);
                    },
                    visible: (): boolean => {
                        return TeamModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private authDataService: AuthDataService,
        private teamDataService: TeamDataService,
        private dialogService: DialogService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        private snackbarService: SnackbarService
    ) {
        super(listHelperService);
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
                // initialize pagination
                this.initPaginator();
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
     * Re(load) the list of Teams
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // retrieve the list of Teams
        this.teamsList$ = this.teamDataService
            .getTeamsList(this.queryBuilder)
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
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.teamsListCount$ = this.teamDataService
            .getTeamsCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    /**
     * Delete a team
     * @param team
     */
    deleteTeam(team) {
        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_DELETE_TEAM', team)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // check if the team is in use
                    const qb: RequestQueryBuilder = new RequestQueryBuilder();
                    qb.filter
                        .where({
                            teamId: {
                                'eq': team.id
                            }
                        }, true);

                    // retrieve follow-ups + contact details
                    this.followUpsDataService
                        .getFollowUpsCount(
                            this.selectedOutbreak.id,
                            qb
                        )
                        .subscribe((followUpsCount) => {
                            if (followUpsCount.count > 0) {
                                this.snackbarService.showError('LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM_IN_USE_MESSAGE');
                            } else {
                                // delete the team
                                this.teamDataService
                                    .deleteTeam(team.id)
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM_SUCCESS_MESSAGE');
                                        // reload data
                                        this.needsRefreshList(true);
                                    });
                            }
                        });
                }
            });
    }
}
