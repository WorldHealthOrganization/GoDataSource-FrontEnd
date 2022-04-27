import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { PhoneNumberType, UserModel, UserSettings } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent extends ListComponent implements OnDestroy {
  // list of existing users
  usersList$: Observable<UserModel[]>;

  // constants
  UserSettings = UserSettings;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private userDataService: UserDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
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
        // TODO: Filter not defined
        field: 'telephoneNumbers',
        label: 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS',
        format: {
          type: (item: UserModel) => {
            return item.telephoneNumbers &&
              item.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER] ?
              this.i18nService.instant(item.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER]) :
              '';
          }
        }
      },
      {
        // TODO: Roles need expandables row feature
        field: 'roles',
        label: 'LNG_USER_FIELD_LABEL_ROLES',
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
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
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        // TODO: Available outbreaks needs expandable row feature
        field: 'availableOutbreaks',
        label: 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS',
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      }
    ];

    // can see teams ?
    if (TeamModel.canList(this.authUser)) {
      // TODO: Teams outbreaks needs expandable row feature
      this.tableColumns.push({
        field: 'teams',
        label: 'LNG_USER_FIELD_LABEL_TEAMS',
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      });
    }

    // rest of columns :)
    this.tableColumns.push(
      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
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
                label: 'LNG_PAGE_LIST_USERS_ACTION_DELETE_USER',
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
                            name: item.name
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
                    UserModel.canDelete(this.authUser);
                }
              }
            ]
          }
        ]
      }
    );
  }

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
        userRole: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        outbreak: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
          label: 'LNG_PAGE_LIST_USERS_ACTION_VIEW_USERS_WORKLOAD',
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
            ['/version']
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
      'roles',
      'activeOutbreakId',
      'outbreakIds'
    ];
  }

  /**
   * Re(load) the Users list
   */
  refreshList() {
    // get the list of existing users
    this.usersList$ = this.userDataService
      .getUsersList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

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

  // TODO: To be deleted, left for inspiration
  /**
     * Retrieve teams
     */
  retrieveTeams(): void {
    // // retrieve teams
    // const qb = new RequestQueryBuilder();
    // qb.fields(
    //   'id',
    //   'name',
    //   'userIds'
    // );
    // this.teamsList$ = this.teamDataService
    //   .getTeamsList(qb)
    //   .pipe(
    //     tap((teams) => {
    //       // go through each team and determine users
    //       this.userTeamMap = {};
    //       teams.forEach((team) => {
    //         // no need to continue ?
    //         // no really necessary since we do the above filter
    //         if (
    //           !team.userIds ||
    //           team.userIds.length < 1
    //         ) {
    //           return;
    //         }

    //         // go through users
    //         team.userIds.forEach((userId) => {
    //           // init array ?
    //           if (!this.userTeamMap[userId]) {
    //             this.userTeamMap[userId] = [];
    //           }

    //           // push team
    //           this.userTeamMap[userId].push(team);
    //         });
    //       });
    //     })
    //   );
  }

  // TODO: To be deleted, left for inspiration
  /**
     * Filter by team
     */
  filterTeamField(_teams: TeamModel[]): void {
    // // determine list of users that we need to retrieve
    // const usersToRetrieve: {
    //   [idUser: string]: true
    // } = {};
    // if (teams) {
    //   teams.forEach((team) => {
    //     (team.userIds || []).forEach((userId) => {
    //       usersToRetrieve[userId] = true;
    //     });
    //   });
    // }

    // // filter
    // this.filterBySelectField(
    //   'id',
    //   Object.keys(usersToRetrieve),
    //   null
    // );
  }
}
