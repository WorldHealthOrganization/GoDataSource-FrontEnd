import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-create-team',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-team.component.html',
    styleUrls: ['./create-team.component.less']
})
export class CreateTeamComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumb header
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_TEAMS_TITLE', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_TEAM_TITLE', '.', true)
    ];
    teamData: TeamModel = new TeamModel();

    usersList$: Observable<UserModel[]>;
    existingUsers: string[] = [];

    constructor(
        private router: Router,
        private teamDataService: TeamDataService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        this.usersList$ = this.userDataService.getUsersList();
    }

    /**
     * Create Team
     * @param {NgForm} form
     */
    createTeam(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        if (form.valid && !_.isEmpty(dirtyFields)) {

            this.checkTeamsInSameLocations(this.teamData.locationIds)
                .subscribe((createTeam: boolean) => {
                    if (createTeam) {
                        this.teamDataService
                            .createTeam(dirtyFields)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showError(err.message);
                                    return throwError(err);
                                })
                            )
                            .subscribe((newTeam: TeamModel) => {
                                this.snackbarService.showSuccess('LNG_PAGE_CREATE_TEAM_ACTION_CREATE_TEAM_SUCCESS_MESSAGE');

                                // navigate to listing page
                                this.disableDirtyConfirm();
                                this.router.navigate([`/teams/${newTeam.id}/modify`]);
                            });
                    }
                });
        }
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
        _.forEach(users, (user, key) => {
            userIds.push(user.id);
        });
        const difUser = _.difference(userIds, this.existingUsers);
        const idUser = difUser[0];
        const qb = new RequestQueryBuilder();
        qb.filter
            .where({
                userIds: {
                    'inq': [idUser]
                }
            }, true);

        this.teamDataService.getTeamsList(qb).subscribe((teamsList) => {
            const teamsNames = [];
            _.forEach(teamsList, (team, key) => {
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

    /**
     * check if there are multiple teams in the same locations
     * @param {string[]} locationIds
     * @returns {Observable<boolean>}
     */
    private checkTeamsInSameLocations(locationIds: string[]): Observable<boolean> {
        return new Observable((observer) => {
            // check if there are existing teams in the same locations
            const qb = new RequestQueryBuilder();

            qb.filter
                .where({
                    locationIds: {
                        'inq': this.teamData.locationIds
                    }
                }, true);

            this.teamDataService.getTeamsList(qb)
                .subscribe((teamsList) => {
                    if (teamsList.length > 0) {
                        const teamNames = _.map(teamsList, (team) => team.name);
                        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_SAVE_SAME_LOCATIONS_TEAM', {teamNames: teamNames.join(', ')})
                            .subscribe((answer: DialogAnswer) => {
                                if (answer.button === DialogAnswerButton.Yes) {
                                    // user accepts the action
                                    observer.next(true);
                                } else {
                                    // user refuses the action
                                    observer.next(false);
                                }

                                observer.complete();
                            });
                    } else {
                        // there aren't any teams in same locations; move on to the next step
                        observer.next(true);
                        observer.complete();
                    }
                });
        });
    }
}
