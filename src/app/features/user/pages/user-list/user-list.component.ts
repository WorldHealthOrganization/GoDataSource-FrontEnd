import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { LanguageModel } from '../../../../core/models/language.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { PhoneNumberType, UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2FilterMultipleSelect, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent extends ListComponent<UserModel> implements OnDestroy {
  // list of existing teams mapped by user
  userTeamMap: {
    [userId: string]: TeamModel[]
  };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private userDataService: UserDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    // parent
    super(listHelperService);

    // map teams by user
    this.userTeamMap = {};
    ((this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).list || []).forEach((team) => {
      // no need to continue ?
      // no really necessary since we do the above filter
      if (
        !team.userIds ||
        team.userIds.length < 1
      ) {
        return;
      }

      // go through users
      team.userIds.forEach((userId) => {
        // init array ?
        if (!this.userTeamMap[userId]) {
          this.userTeamMap[userId] = [];
        }

        // push team
        this.userTeamMap[userId].push(team);
      });
    });
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
  * Component initialized
  */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View User
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_USERS_ACTION_VIEW_USER',
          action: {
            link: (item: UserModel): string[] => {
              return ['/users', item.id, 'view'];
            }
          },
          visible: (item: UserModel): boolean => {
            return item.id !== this.authUser.id &&
              UserModel.canView(this.authUser);
          }
        },

        // Modify User
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_USERS_ACTION_MODIFY_USER',
          action: {
            link: (item: UserModel): string[] => {
              return ['/users', item.id, 'modify'];
            }
          },
          visible: (item: UserModel): boolean => {
            return item.id !== this.authUser.id &&
              UserModel.canModify(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete User
            {
              label: {
                get: () => 'LNG_PAGE_LIST_USERS_ACTION_DELETE_USER'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: UserModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.name
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_USER',
                        data: () => ({
                          firstName: item.firstName,
                          lastName: item.lastName
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete the user
                    this.userDataService
                      .deleteUser(item.id)
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.toastV2Service.success('LNG_PAGE_LIST_USERS_ACTION_DELETE_USER_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: UserModel): boolean => {
                return item.id !== this.authUser.id &&
                  item.id !== 'sys_admin' &&
                  UserModel.canDelete(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_USER_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_USER_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'email',
        label: 'LNG_USER_FIELD_LABEL_EMAIL',
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        },
        sortable: true
      },
      {
        field: 'institutionName',
        label: 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: `telephoneNumbers.${PhoneNumberType.PRIMARY_PHONE_NUMBER}`,
        label: 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS',
        format: {
          type: (item: UserModel) => {
            return item.telephoneNumbers && item.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER] ?
              item.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER] :
              '';
          }
        },
        filter: {
          type: V2FilterType.PHONE_NUMBER
        }
      },
      {
        field: 'roleIds',
        label: 'LNG_USER_FIELD_LABEL_ROLES',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: UserModel) => item.roles?.length > 0 ?
          item.roles.map((role) => {
            return {
              label: role.name,
              href: UserRoleModel.canView(this.authUser) ?
                `/user-roles/${role.id}/view` :
                null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<UserRoleModel>).options
        }
      },
      {
        field: 'activeOutbreakId',
        label: 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK',
        format: {
          type: (user: UserModel) => {
            return user.activeOutbreakId &&
              (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[user.activeOutbreakId] ?
              (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[user.activeOutbreakId].name :
              '';
          }
        },
        link: (user: UserModel) => {
          return user.activeOutbreakId &&
            OutbreakModel.canView(this.authUser) &&
            (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[user.activeOutbreakId] ?
            `/outbreaks/${user.activeOutbreakId}/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'outbreakIds',
        label: 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: UserModel) => item.outbreakIds?.length > 0 ?
          item.outbreakIds
            .filter((outbreakId) => !!(this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId])
            .map((outbreakId) => {
              return {
                label: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId].name,
                href: OutbreakModel.canView(this.authUser) ?
                  `/outbreaks/${outbreakId}/view` :
                  null
              };
            }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options
        }
      },
      {
        field: 'languageId',
        label: 'LNG_USER_FIELD_LABEL_LANGUAGE',
        format: {
          type: (user: UserModel) => {
            return (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).map[user.languageId] ?
              (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).map[user.languageId].name :
              '';
          }
        },
        link: (user: UserModel) => user.languageId && LanguageModel.canView(this.authUser) && (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).map[user.languageId] ?
          `languages/${user.languageId}/view` :
          undefined,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).options
        }
      }
    ];

    // can see teams ?
    if (TeamModel.canList(this.authUser)) {
      this.tableColumns.push({
        field: 'teams',
        label: 'LNG_USER_FIELD_LABEL_TEAMS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: UserModel) => this.userTeamMap[item.id]?.length > 0 ?
          this.userTeamMap[item.id].map((team) => {
            return {
              label: team.name,
              href: TeamModel.canView(this.authUser) ?
                `/teams/${team.id}/view` :
                null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
          search: (column: IV2Column) => {
            // retrieve teams
            const teamIds: string[] = (column.filter as IV2FilterMultipleSelect).value;

            // determine user ids
            const userIdsMap: {
              [userId: string]: true
            } = {};
            (teamIds || []).forEach((teamId) => {
              // noting to do ?
              if ((this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[teamId]?.userIds?.length < 1) {
                return;
              }

              // retrieve users
              (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[teamId].userIds.forEach((userId) => {
                userIdsMap[userId] = true;
              });
            });

            // nothing to retrieve ?
            const userIds: string[] = Object.keys(userIdsMap);
            if (
              teamIds?.length > 0 &&
              userIds.length < 1
            ) {
              userIds.push('-1');
            }

            // filter
            this.queryBuilder.filter.bySelect(
              'id',
              userIds,
              true,
              null
            );

            // refresh list
            this.needsRefreshList();
          }
        }
      });
    }
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = UserModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        institution: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        userRole: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<UserRoleModel>).options,
        outbreak: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        language: (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).options
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return UserModel.canListWorkload(this.authUser);
      },
      menuOptions: [
        // Onset report
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USERS_ACTION_VIEW_USERS_WORKLOAD'
          },
          action: {
            link: () => ['/users', 'workload']
          },
          visible: (): boolean => {
            return UserModel.canListWorkload(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/users', 'create']
      },
      visible: (): boolean => {
        return UserModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_LIST_USERS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'firstName',
      'email',
      'institutionName',
      'telephoneNumbers',
      'roleIds',
      'roles',
      'activeOutbreakId',
      'outbreakIds',
      'languageId'
    ];
  }

  /**
   * Re(load) the Users list
   */
  refreshList() {
    // get the list of existing users
    this.records$ = this.userDataService
      .getUsersList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    this.userDataService
      .getUsersCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}
