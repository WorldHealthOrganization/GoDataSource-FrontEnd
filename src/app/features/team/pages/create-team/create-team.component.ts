import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Observable, throwError } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-team',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './create-team.component.html',
  styleUrls: ['./create-team.component.less']
})
export class CreateTeamComponent
  extends CreateConfirmOnChanges
  implements OnInit {
  // breadcrumb header
  // breadcrumbs: BreadcrumbItemModel[] = [];

  teamData: TeamModel = new TeamModel();

  usersList$: Observable<UserModel[]>;
  existingUsers: string[] = [];

  // authenticated user details
  authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private teamDataService: TeamDataService,
    private userDataService: UserDataService,
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
    private dialogService: DialogService,
    private authDataService: AuthDataService,
    private redirectService: RedirectService
  ) {
    super();
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // retrieve user list
    const qbUsers = new RequestQueryBuilder();
    qbUsers.sort
      .by('firstName', RequestSortDirection.ASC)
      .by('lastName', RequestSortDirection.ASC);
    this.usersList$ = this.userDataService.getUsersList(qbUsers);

    // initialize breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Initialize breadcrumbs
     */
  private initializeBreadcrumbs() {
    // // reset
    // this.breadcrumbs = [];
    //
    // // add list breadcrumb only if we have permission
    // if (TeamModel.canList(this.authUser)) {
    //   this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_TEAMS_TITLE', '/teams'));
    // }
    //
    // // create breadcrumb
    // this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_TEAM_TITLE', '.', true));
  }

  /**
     * Create Team
     * @param {NgForm} form
     */
  createTeam(form: NgForm) {
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    if (form.valid && !_.isEmpty(dirtyFields)) {

      this.checkTeamsInSameLocations()
        .subscribe((createTeam: boolean) => {
          if (createTeam) {
            this.teamDataService
              .createTeam(dirtyFields)
              .pipe(
                catchError((err) => {
                  this.toastV2Service.error(err);
                  return throwError(err);
                })
              )
              .subscribe((newTeam: TeamModel) => {
                this.toastV2Service.success('LNG_PAGE_CREATE_TEAM_ACTION_CREATE_TEAM_SUCCESS_MESSAGE');

                // navigate to proper page
                // method handles disableDirtyConfirm too...
                this.redirectToProperPageAfterCreate(
                  this.router,
                  this.redirectService,
                  this.authUser,
                  TeamModel,
                  'teams',
                  newTeam.id
                );
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
    _.forEach(users, (user) => {
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
      _.forEach(teamsList, (team) => {
        teamsNames.push(team.name);
      });

      if (teamsNames.length > 0) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_ADD_USER_TEAM', { teamNames: teamsNames.join() })
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
  private checkTeamsInSameLocations(): Observable<boolean> {
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
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_SAVE_SAME_LOCATIONS_TEAM', { teamNames: teamNames.join(', ') })
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
