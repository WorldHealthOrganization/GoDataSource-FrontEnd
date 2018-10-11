import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { Observable } from 'rxjs/Observable';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-team',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-team.component.html',
    styleUrls: ['./modify-team.component.less']
})
export class ModifyTeamComponent extends ViewModifyComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_TEAMS_TITLE',
            '/teams'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_MODIFY_TEAM_TITLE',
            '.',
            true
        )
    ];

    teamId: string;
    teamData: TeamModel = new TeamModel();
    authUser: UserModel;
    usersList$: Observable<UserModel[]>;
    existingUsers: string[];

    constructor(
        private teamDataService: TeamDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private userDataService: UserDataService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.usersList$ = this.userDataService.getUsersList();

        this.route.params
            .subscribe((params: { teamId }) => {
                this.teamId = params.teamId;
                if (this.teamId) {
                    this.teamDataService
                        .getTeam(this.teamId)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            this.router.navigate(['/teams']);
                            return ErrorObservable.create(err);
                        })
                        .subscribe((teamData: {}) => {
                            // location data
                            this.teamData = new TeamModel(teamData);
                            this.existingUsers = this.teamData.userIds;
                        });
                }
            });
    }

    /**
     * Modify team
     * @param {NgForm} form
     */
    modifyTeam(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // check if there are existing teams in the same locations
        const qb = new RequestQueryBuilder();

        qb.filter
            .where({
                locationIds: {
                    'inq': this.teamData.locationIds
                },
                id: {
                    'neq': this.teamId
                }
            }, true);

        this.teamDataService.getTeamsList(qb).subscribe((teamsList) => {
            if (teamsList.length > 0) {
                const teamsNames = [];
                _.forEach(teamsList, (team, key ) => {
                    teamsNames.push(team.name);
                });
                this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_SAVE_SAME_LOCATIONS_TEAM', {teamNames: teamsNames.join()})
                    .subscribe((answer: DialogAnswer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            this.teamDataService
                                .modifyTeam(this.teamId, dirtyFields)
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);

                                    return ErrorObservable.create(err);
                                })
                                .subscribe(() => {
                                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_TEAM_ACTION_MODIFY_TEAM_SUCCESS_MESSAGE');
                                    // navigate to listing page
                                    this.disableDirtyConfirm();
                                    this.router.navigate(['/teams']);
                                });
                        }
                    });
            } else {
                this.teamDataService
                    .modifyTeam(this.teamId, dirtyFields)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);

                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        this.snackbarService.showSuccess('LNG_PAGE_MODIFY_TEAM_ACTION_MODIFY_TEAM_SUCCESS_MESSAGE');
                        // navigate to listing page
                        this.disableDirtyConfirm();
                        this.router.navigate(['/teams']);
                    });
            }
        });


    }

    /**
     * Check if we have write access to teams
     * @returns {boolean}
     */
    hasTeamWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_TEAM);
    }

    /**
     * Trigger when the users dropdown changes
     * @param users
     */
    usersChanged(users) {
        if (users.length > this.existingUsers.length) {
            this.checkUsersMultipleTeams(users);
        }
        this.existingUsers = this.teamData.userIds;
    }

    /**
     * check if a user is present in multiple teams
     * @param users
     */
    checkUsersMultipleTeams(users) {
        const userIds = [];
        _.forEach(users, (user, key ) => {
            userIds.push(user.id);
        });
        const difUser = _.difference(userIds, this.existingUsers);
        const idUser = difUser[0];
        const qb = new RequestQueryBuilder();
        qb.filter
            .where({
                userIds: {
                    'inq': [idUser]
                },
                id: {
                    'neq': this.teamId
                }
            }, true);

        this.teamDataService.getTeamsList(qb).subscribe((teamsList) => {
            const teamsNames = [];
            _.forEach(teamsList, (team, key ) => {
                teamsNames.push(team.name);
            });

            if (teamsNames.length > 0) {
                this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_ADD_USER_TEAM', {teamNames: teamsNames.join()})
                    .subscribe((answer: DialogAnswer) => {
                        if (answer.button === DialogAnswerButton.Cancel) {
                            // update userIds to remove the user from the dropdown
                            const index = this.teamData.userIds.indexOf(idUser);
                            this.teamData.userIds.splice(index, 1);
                            // make a clone so the binding will know that the object changed. It's not working with splice only.
                            this.teamData.userIds = [...this.teamData.userIds];
                        }
                    });
            }
        });
    }
}
