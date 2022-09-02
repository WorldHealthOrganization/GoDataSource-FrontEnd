import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { RequestFilterGenerator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AppFormLocationBaseV2 } from '../../../../shared/forms-v2/core/app-form-location-base-v2';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { Subscription } from 'rxjs/internal/Subscription';
import { Location } from '@angular/common';

/**
 * Component
 */
@Component({
  selector: 'app-team-create-view-modify',
  templateUrl: './team-create-view-modify.component.html'
})
export class TeamCreateViewModifyComponent extends CreateViewModifyComponent<TeamModel> implements OnDestroy {
  // subscriptions
  private _previousCheckForMultipleTeams: Subscription;

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected translateService: TranslateService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected teamDataService: TeamDataService,
    protected location: Location,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_USER_IN_MULTIPLE_TEAMS);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): TeamModel {
    return new TeamModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: TeamModel): Observable<TeamModel> {
    return this.teamDataService
      .getTeam(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.teamId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // check if record has duplicate
    this.checkForMultipleTeams();
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_TEAM_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_TEAM_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_TEAM_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // list page
    if (TeamModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_TEAMS_TITLE',
        action: {
          link: ['/teams']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_TEAM_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_TEAM_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_TEAM_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_TEAM_ACTION_CREATE_TEAM_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: TeamModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/teams',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: this.isCreate ?
        'LNG_PAGE_CREATE_TEAM_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_TEAM_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_TEAM_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_TEAM_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_TEAM_FIELD_LABEL_NAME',
              description: () => 'LNG_TEAM_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  // set data
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'userIds',
              placeholder: () => 'LNG_TEAM_FIELD_LABEL_USERS',
              description: () => 'LNG_TEAM_FIELD_LABEL_USERS_DESCRIPTION',
              value: {
                get: () => this.itemData.userIds,
                set: (value) => {
                  // set data
                  this.itemData.userIds = value;

                  // check for assignments
                  this.checkForMultipleTeams();
                }
              },
              options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.LOCATION_MULTIPLE,
              name: 'locationIds',
              placeholder: () => 'LNG_TEAM_FIELD_LABEL_LOCATIONS',
              description: () => 'LNG_TEAM_FIELD_LABEL_LOCATIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.locationIds,
                set: (value) => {
                  // set data
                  this.itemData.locationIds = value;
                }
              },
              validators: {
                required: () => true
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/teams', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/teams', this.itemData?.id, 'modify']
        },
        visible: () => TeamModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/teams']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/teams']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/teams']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            },
            visible: () => !this.isCreate
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished,
      loading,
      _forms
    ) => {
      // check if there are existing teams in the same locations
      const qb = new RequestQueryBuilder();
      qb.filter.where({
        locationIds: {
          'inq': this.itemData.locationIds
        }
      });

      // on update make sure we exclude current team
      if (type === CreateViewModifyV2ActionType.UPDATE) {
        qb.filter.where({
          id: {
            neq: this.itemData.id
          }
        });
      }

      // check
      this.teamDataService
        .getTeamsList(qb)
        .pipe(
          catchError((err) => {
            // show error
            finished(err, undefined);

            // err
            return throwError(err);
          })
        )
        .subscribe((teams) => {
          // save data
          const saveData = () => {
            // if we've changed the location of the team, reset all location cache
            if (data.locationIds) {
              AppFormLocationBaseV2.CACHE = {};
            }

            // create / modify
            (
              type === CreateViewModifyV2ActionType.CREATE ?
                this.teamDataService.createTeam(
                  data
                ) :
                this.teamDataService.modifyTeam(
                  this.itemData.id,
                  data
                )
            ).pipe(
              catchError((err) => {
                // show error
                finished(err, undefined);

                // finished
                return throwError(err);
              })
            ).subscribe((outbreak) => {
              // display message
              this.toastV2Service.success(
                type === CreateViewModifyV2ActionType.CREATE ?
                  'LNG_PAGE_CREATE_TEAM_ACTION_CREATE_TEAM_SUCCESS_MESSAGE' :
                  'LNG_PAGE_MODIFY_TEAM_ACTION_MODIFY_TEAM_SUCCESS_MESSAGE'
              );

              // hide loading & redirect
              finished(undefined, outbreak);
            });
          };

          // no conflict ?
          if (!teams?.length) {
            saveData();
          } else {
            // conflict
            this.dialogV2Service.showConfirmDialog({
              config: {
                title: {
                  get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                },
                message: {
                  get: () => 'LNG_DIALOG_CONFIRM_SAVE_SAME_LOCATIONS_TEAM',
                  data: () => ({
                    teamNames: teams.map((team) => team.name).join(', ')
                  })
                }
              }
            }).subscribe((response) => {
              // canceled ?
              if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                // don't save
                loading.hide();

                // finished
                return;
              }

              // save
              saveData();
            });
          }
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: TeamModel) => item.name,
      link: (item: TeamModel) => ['/teams', item.id, 'view']
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = TeamModel.generateAdvancedFilters({
      options: {
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      }
    });
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.teamDataService
      .getTeamsList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Check for multiple...
   */
  private checkForMultipleTeams(): void {
    // applies only to create & modify
    if (this.isView) {
      return;
    }

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_USER_IN_MULTIPLE_TEAMS);

    // nothing to check ?
    if (!this.itemData.userIds?.length) {
      return;
    }

    // construct query
    const qb = new RequestQueryBuilder();
    qb.filter.where({
      userIds: {
        inq: this.itemData.userIds
      }
    });

    // exclude current team
    if (this.isModify) {
      qb.filter.where({
        id: {
          neq: this.itemData.id
        }
      });
    }

    // map list of users
    const userIdsMap: {
      [userId: string]: true
    } = {};
    this.itemData.userIds.forEach((userId) => {
      userIdsMap[userId] = true;
    });

    // cancel previous
    if (this._previousCheckForMultipleTeams) {
      this._previousCheckForMultipleTeams.unsubscribe();
      this._previousCheckForMultipleTeams = undefined;
    }

    // check
    this._previousCheckForMultipleTeams = this.teamDataService
      .getTeamsList(qb)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((teams) => {
        // finished
        this._previousCheckForMultipleTeams = undefined;

        // nothing to do ?
        if (!teams?.length) {
          return;
        }

        // construct html
        let assigned: string = '';
        const users: IResolverV2ResponseModel<UserModel> = this.activatedRoute.snapshot.data.user;
        teams.forEach((team, index) => {
          // render users
          const usersHTML: string = team.userIds
            .filter((userId) => userIdsMap[userId])
            .map((userId) => users.map[userId] ?
              `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(`/users/${userId}/view`)}"><span>${users.map[userId].name}</span></a>` :
              '—'
            ).join(', ');

          // render team
          assigned += `<div>
            ${index + 1}.
            <a class="gd-alert-link" href="${this.location.prepareExternalUrl(`/teams/${team.id}/view`)}"><span>${team.name}</span></a>:
            ${usersHTML}
          </div>`;
        });

        // display alert
        this.toastV2Service.notice(
          'LNG_DIALOG_CONFIRM_ADD_USER_TEAM',
          {
            assigned
          },
          AppMessages.APP_MESSAGE_USER_IN_MULTIPLE_TEAMS
        );
      });
  }
}
