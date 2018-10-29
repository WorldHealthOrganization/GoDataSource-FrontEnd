import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import 'rxjs/add/operator/filter';
import { Observable } from 'rxjs/Observable';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';

@Component({
    selector: 'app-team-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './team-list.component.html',
    styleUrls: ['./team-list.component.less']
})
export class TeamListComponent extends ListComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_TEAMS_TITLE',
            '/teams'
        )
    ];

    // list of teams
    teamsList: TeamModel[];
    teamsListCount$: Observable<any>;

    // authenticated user
    authUser: UserModel;
    // selected outbreak - needed to check assignment at delete team
    selectedOutbreak: OutbreakModel;

    constructor(
        private authDataService: AuthDataService,
        private teamDataService: TeamDataService,
        private dialogService: DialogService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected snackbarService: SnackbarService
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
                // initialize pagination
                this.initPaginator();
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) the list of Teams
     */
    refreshList() {
        // retrieve the list of Teams
        this.teamDataService.getTeamsList().subscribe((teamsList) => {
            this.teamsList = teamsList;
        });
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();

        this.teamsListCount$ = this.teamDataService.getTeamsCount(countQueryBuilder);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // default columns that we should display
        const columns = [
            'name',
            'users',
            'locations',
            'actions'
        ];

        // finished
        return columns;
    }

    /**
     * Check if we have write access to teams
     * @returns {boolean}
     */
    hasTeamWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_TEAM);
    }

    /**
     * Delete a team
     * @param team
     */
    deleteTeam(team) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_TEAM', team)
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
                    this.followUpsDataService.getFollowUpsList(
                        this.selectedOutbreak.id,
                        qb
                    ).subscribe((followUps: FollowUpModel[]) => {
                        if (followUps.length > 0) {
                            this.snackbarService.showError('LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM_IN_USE_MESSAGE');
                        } else {
                            // delete the team
                            this.teamDataService
                                .deleteTeam(team.id)
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);

                                    return ErrorObservable.create(err);
                                })
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