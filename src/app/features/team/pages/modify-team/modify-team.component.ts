import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { Observable } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import * as _ from 'lodash';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-modify-team',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-team.component.html',
    styleUrls: ['./modify-team.component.less']
})
export class ModifyTeamComponent extends ViewModifyComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    TeamModel = TeamModel;

    teamId: string;
    teamData: TeamModel = new TeamModel();
    authUser: UserModel;
    usersList$: Observable<UserModel[]>;
    existingUsers: string[];

    /**
     * Constructor
     */
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

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        const qbUsers = new RequestQueryBuilder();
        qbUsers.sort
            .by('firstName', RequestSortDirection.ASC)
            .by('lastName', RequestSortDirection.ASC);
        this.usersList$ = this.userDataService.getUsersList(qbUsers);

        this.route.params
            .subscribe((params: { teamId }) => {
                this.teamId = params.teamId;
                if (this.teamId) {
                    this.teamDataService
                        .getTeam(this.teamId)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                this.router.navigate(['/teams']);
                                return throwError(err);
                            })
                        )
                        .subscribe((teamData: {}) => {
                            // location data
                            this.teamData = new TeamModel(teamData);
                            this.existingUsers = this.teamData.userIds;
                        });
                }
            });

        // update breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (TeamModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_TEAMS_TITLE', '/teams'));
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel(
            this.viewOnly ?
                'LNG_PAGE_VIEW_TEAM_TITLE' :
                'LNG_PAGE_MODIFY_TEAM_TITLE',
            '.',
            true
        ));
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

        const loadingDialog = this.dialogService.showLoadingDialog();
        this.checkTeamsInSameLocations(this.teamData.locationIds)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((createTeam: boolean) => {
                if (createTeam) {
                    this.teamDataService
                        .modifyTeam(this.teamId, dirtyFields)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe((modifiedTeam: TeamModel) => {
                            // update model
                            this.teamData = modifiedTeam;

                            // mark form as pristine
                            form.form.markAsPristine();

                            // display message
                            this.snackbarService.showSuccess('LNG_PAGE_MODIFY_TEAM_ACTION_MODIFY_TEAM_SUCCESS_MESSAGE');

                            // hide dialog
                            loadingDialog.close();
                        });
                } else {
                    // hide dialog
                    loadingDialog.close();
                }
            });
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
                },
                id: {
                    'neq': this.teamId
                }
            }, true);

        this.teamDataService
            .getTeamsList(qb)
            .subscribe((teamsList) => {
                const teamsNames = [];
                _.forEach(teamsList, (team) => {
                    teamsNames.push(team.name);
                });

                if (teamsNames.length > 0) {
                    this.dialogService
                        .showConfirm('LNG_DIALOG_CONFIRM_ADD_USER_TEAM', {teamNames: teamsNames.join()})
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
                .pipe(
                    catchError((err) => {
                        observer.error(err);
                        return throwError(err);
                    })
                )
                .subscribe((teamsList: TeamModel[]) => {
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
