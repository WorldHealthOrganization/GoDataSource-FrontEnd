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
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import {
  ExportDataExtension,
  ExportDataMethod
} from '../../../../core/services/helper/models/dialog-v2.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as momentOriginal from 'moment/moment';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent extends ListComponent<UserModel, IV2Column> implements OnDestroy {
  // user fields
  userFields: ILabelValuePairModel[] = [
    { label: 'LNG_USER_FIELD_LABEL_EMAIL', value: 'email' },
    { label: 'LNG_COMMON_FIELD_LABEL_PASSWORD', value: 'password' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_USER_FIELD_LABEL_FIRST_NAME', value: 'firstName' },
    { label: 'LNG_USER_FIELD_LABEL_LAST_NAME', value: 'lastName' },
    { label: 'LNG_USER_FIELD_LABEL_ROLES', value: 'roleIds' },
    { label: 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS', value: 'outbreakIds' },
    { label: 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK', value: 'activeOutbreakId' },
    { label: 'LNG_LAYOUT_LANGUAGE_LABEL', value: 'languageId' },
    { label: 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME', value: 'institutionName' },
    { label: 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS', value: 'telephoneNumbers' },
    { label: 'LNG_USER_FIELD_LABEL_PRIMARY_TELEPHONE', value: 'telephoneNumbers.LNG_USER_FIELD_LABEL_PRIMARY_TELEPHONE' },
    { label: 'LNG_USER_FIELD_LABEL_SECURITY_QUESTIONS', value: 'securityQuestions' },
    { label: 'LNG_USER_FIELD_LABEL_DISREGARD_GEOGRAPHIC_RESTRICTIONS', value: 'disregardGeographicRestrictions' },
    { label: 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS', value: 'dontCacheFilters' },
    { label: 'LNG_USER_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_USER_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_USER_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_USER_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_USER_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_USER_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_USER_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

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
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService
  ) {
    // parent
    super(
      listHelperService, {
        disableWaitForSelectedOutbreakToRefreshList: true
      }
    );

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
            (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[user.activeOutbreakId] &&
            !(this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[user.activeOutbreakId].deleted ?
            `/outbreaks/${user.activeOutbreakId}/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options.filter((item) => !item.data.deleted),
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
            .map((outbreakId) => {
              return {
                label: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId] ?
                  (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId].name :
                  outbreakId,
                href: OutbreakModel.canView(this.authUser) &&
                  (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId] &&
                  !(this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId].deleted ?
                  `/outbreaks/${outbreakId}/view` :
                  null
              };
            }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options.filter((item) => !item.data.deleted)
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
      },
      {
        field: 'disregardGeographicRestrictions',
        label: 'LNG_USER_FIELD_LABEL_DISREGARD_GEOGRAPHIC_RESTRICTIONS',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'dontCacheFilters',
        label: 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'lastLogin',
        label: 'LNG_USER_FIELD_LABEL_LAST_LOGIN',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_USER_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_USER_FIELD_LABEL_CREATED_ON',
        notVisible: true,
        format: {
          type: (item) => item.createdOn ?
            this.i18nService.instant(`LNG_PLATFORM_LABEL_${item.createdOn}`) :
            item.createdOn
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          includeNoValue: true
        },
        sortable: true
      },
      {
        field: 'createdAt',
        label: 'LNG_USER_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'updatedBy',
        label: 'LNG_USER_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_USER_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
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
  protected initializeProcessSelectedData(): void {
    this.processSelectedData = [
      // all selected records are not deleted and current user not selected ?
      {
        key: 'allNotDeletedAndCurrentUserNotSelected',
        shouldProcess: () => UserModel.canBulkDelete(this.authUser),
        process: (
          dataMap: {
            [id: string]: UserModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allNotDeletedAndCurrentUserNotSelected: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (
              dataMap[selected[index]]?.deleted ||
              dataMap[selected[index]]?.id === this.authUser.id ||
              dataMap[selected[index]]?.id === 'sys_admin'
            ) {
              // at least one not deleted
              allNotDeletedAndCurrentUserNotSelected = false;

              // stop
              break;
            }
          }

          // finished
          return allNotDeletedAndCurrentUserNotSelected;
        }
      }
    ];
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
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        institution: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        userRole: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<UserRoleModel>).options,
        outbreak: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options.filter((item) => !item.data.deleted),
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        language: (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
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
        return UserModel.canListWorkload(this.authUser) ||
          UserModel.canExport(this.authUser) ||
          UserModel.canImport(this.authUser);
      },
      menuOptions: [
        // Export users
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USERS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportUsers(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return UserModel.canExport(this.authUser);
          }
        },

        // Import users
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USERS_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'user-data', 'import']
          },
          visible: (): boolean => {
            return UserModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              UserModel.canExport(this.authUser) ||
              UserModel.canImport(this.authUser)
            );
          }
        },

        // View workload
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
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => UserModel.canExport(this.authUser) ||
        UserModel.canBulkDelete(this.authUser),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USERS_GROUP_ACTION_EXPORT_SELECTED_USERS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect('id', selected, true, null);

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportUsers(qb);
            }
          },
          visible: (): boolean => {
            return UserModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: () => UserModel.canExport(this.authUser) &&
            UserModel.canBulkDelete(this.authUser)
        },

        // bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USERS_GROUP_ACTION_DELETE_SELECTED_USERS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeletedAndCurrentUserNotSelected ?
            this.i18nService.instant('LNG_PAGE_LIST_USERS_GROUP_ACTION_DELETE_SELECTED_USERS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_DELETE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_USERS'
                    }
                  }
                })
                .subscribe((response) => {
                  // canceled ?
                  if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // show loading
                  const loading = this.dialogV2Service.showLoadingDialog();
                  loading.message({
                    message: 'LNG_PAGE_LIST_USERS_ACTION_DELETE_SELECTED_USERS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en')
                    }
                  });

                  // delete - we can't use bulk here since deleting users triggers many hooks, this is why we delete them one by one
                  const selectedShallowClone: string[] = [...selected];
                  const nextDelete = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.toastV2Service.success('LNG_PAGE_LIST_USERS_ACTION_DELETE_SELECTED_USERS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // delete
                    this.userDataService
                      .deleteUser(selectedShallowClone.shift())
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_USERS_ACTION_DELETE_SELECTED_USERS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: selected.length.toLocaleString('en')
                          }
                        });

                        // next
                        nextDelete();
                      });
                  };

                  // start delete
                  nextDelete();
                });
            }
          },
          visible: (): boolean => {
            return UserModel.canBulkDelete(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeletedAndCurrentUserNotSelected;
          }
        }
      ]
    };
  }

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
      'languageId',
      'disregardGeographicRestrictions',
      'dontCacheFilters',
      'lastLogin',
      'createdBy',
      'createdOn',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Users list
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

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
    countQueryBuilder.clearFields();

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

  /**
   * Export selected records
   */
  private exportUsers(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportData({
        title: {
          get: () => 'LNG_PAGE_LIST_USERS_EXPORT_TITLE'
        },
        export: {
          url: '/users/export',
          async: true,
          method: ExportDataMethod.POST,
          fileName: `${ this.i18nService.instant('LNG_PAGE_LIST_USERS_TITLE') } - ${ momentOriginal().format('YYYY-MM-DD HH:mm') }`,
          queryBuilder: qb,
          allow: {
            types: [
              ExportDataExtension.CSV,
              ExportDataExtension.XLS,
              ExportDataExtension.XLSX,
              ExportDataExtension.JSON,
              ExportDataExtension.ODS,
              ExportDataExtension.PDF
            ],
            encrypt: true,
            anonymize: {
              fields: this.userFields
            },
            fields: {
              options: this.userFields
            },
            dbColumns: true,
            dbValues: true,
            jsonReplaceUndefinedWithNull: true
          }
        }
      });
  }
}
