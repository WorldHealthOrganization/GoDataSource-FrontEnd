import { Component, OnDestroy } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TeamModel } from '../../../../core/models/team.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { ActivatedRoute } from '@angular/router';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import * as _ from 'lodash';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { LocationModel } from '../../../../core/models/location.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import {
  ExportDataExtension,
  ExportDataMethod
} from '../../../../core/services/helper/models/dialog-v2.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as momentOriginal from 'moment/moment';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.component.html'
})
export class TeamListComponent extends ListComponent<TeamModel, IV2Column> implements OnDestroy {
  // team fields
  teamFields: ILabelValuePairModel[] = [
    { label: 'LNG_TEAM_FIELD_LABEL_NAME', value: 'name' },
    { label: 'LNG_TEAM_FIELD_LABEL_USERS', value: 'userIds' },
    { label: 'LNG_TEAM_FIELD_LABEL_LOCATIONS', value: 'locationIds' },
    { label: 'LNG_TEAM_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_TEAM_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_TEAM_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_TEAM_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_TEAM_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_TEAM_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_TEAM_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private teamDataService: TeamDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private locationDataService: LocationDataService,
    private followUpsDataService: FollowUpsDataService,
    private i18nService: I18nService
  ) {
    // parent
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
        // View
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_TEAMS_ACTION_VIEW_TEAM',
          action: {
            link: (item: TeamModel): string[] => {
              return ['/teams', item.id, 'view'];
            }
          },
          visible: (item: TeamModel): boolean => {
            return item.id !== this.authUser.id &&
              TeamModel.canView(this.authUser);
          }
        },

        // Modify
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_TEAMS_ACTION_MODIFY_TEAM',
          action: {
            link: (item: TeamModel): string[] => {
              return ['/teams', item.id, 'modify'];
            }
          },
          visible: (item: TeamModel): boolean => {
            return item.id !== this.authUser.id &&
              TeamModel.canModify(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete
            {
              label: {
                get: () => 'LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: TeamModel): void => {
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
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_TEAM',
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

                    // check if the team is in use
                    const qb: RequestQueryBuilder = new RequestQueryBuilder();
                    qb.filter
                      .where({
                        teamId: {
                          'eq': item.id
                        }
                      }, true);

                    // no need for more
                    qb.limit(1);

                    // retrieve follow-ups + contact details
                    this.followUpsDataService
                      .getFollowUpsCount(
                        this.selectedOutbreak.id,
                        qb
                      )
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
                      .subscribe((followUpsCount) => {
                        // used ?
                        if (followUpsCount.count > 0) {
                          // show error
                          this.toastV2Service.error('LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM_IN_USE_MESSAGE');

                          // hide loading
                          loading.close();

                          // finished
                          return;
                        }

                        // delete
                        this.teamDataService
                          .deleteTeam(item.id)
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
                            this.toastV2Service.success('LNG_PAGE_LIST_TEAMS_ACTION_DELETE_TEAM_SUCCESS_MESSAGE');

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  });
                }
              },
              visible: (item: TeamModel): boolean => {
                return item.id !== this.authUser.id &&
                  TeamModel.canDelete(this.authUser);
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
        field: 'name',
        label: 'LNG_TEAM_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'userIds',
        label: 'LNG_TEAM_FIELD_LABEL_USERS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: TeamModel) => item.userIds?.length > 0 ?
          item.userIds.map((userId) => {
            return {
              label: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).map[userId] ?
                (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).map[userId].nameAndEmail :
                '—',
              href: UserModel.canView(this.authUser) ?
                `/users/${userId}/view` :
                null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        }
      },
      {
        field: 'locationIds',
        label: 'LNG_TEAM_FIELD_LABEL_LOCATIONS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: TeamModel) => item.locations?.length > 0 ?
          item.locations.map((location) => {
            return {
              label: location.name,
              href: LocationModel.canView(this.authUser) ?
                `/locations/${location.id}/view` :
                null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_LOCATION,
          useOutbreakLocations: false,
          field: 'parentLocationIdFilter'
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_ON',
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
        field: 'createdBy',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_AT',
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
        label: 'LNG_TEAM_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_TEAM_FIELD_LABEL_UPDATED_AT',
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
    this.advancedFilters = TeamModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
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
        return TeamModel.canListWorkload(this.authUser) ||
          TeamModel.canExport(this.authUser) ||
          TeamModel.canImport(this.authUser);
      },
      menuOptions: [
        // Export teams
        {
          label: {
            get: () => 'LNG_PAGE_LIST_TEAMS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportTeams(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return TeamModel.canExport(this.authUser);
          }
        },

        // Import teams
        {
          label: {
            get: () => 'LNG_PAGE_LIST_TEAMS_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'team-data', 'import']
          },
          visible: (): boolean => {
            return TeamModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              TeamModel.canExport(this.authUser) ||
              TeamModel.canImport(this.authUser)
            );
          }
        },

        // View workload
        {
          label: {
            get: () => 'LNG_PAGE_LIST_TEAMS_ACTION_VIEW_TEAMS_WORKLOAD'
          },
          action: {
            link: () => ['/teams', 'workload']
          },
          visible: (): boolean => {
            return TeamModel.canListWorkload(this.authUser);
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
      visible: () => TeamModel.canExport(this.authUser),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_TEAMS_GROUP_ACTION_EXPORT_SELECTED_TEAMS'
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
              this.exportTeams(qb);
            }
          },
          visible: (): boolean => {
            return TeamModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
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
        link: (): string[] => ['/teams', 'create']
      },
      visible: (): boolean => {
        return TeamModel.canCreate(this.authUser);
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
        label: 'LNG_PAGE_LIST_TEAMS_TITLE',
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
      'name',
      'userIds',
      'locationIds',
      'createdOn',
      'createdBy',
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
    this.records$ = this.teamDataService
      .getTeamsList(this.queryBuilder)
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            (item.locationIds || []).forEach((locationId) => {
              // nothing to add ?
              if (!locationId) {
                return;
              }

              // add location to list
              locationsIdsMap[locationId] = true;
            });
          });

          // determine ids
          const locationIds: string[] = Object.keys(locationsIdsMap);

          // nothing to retrieve ?
          if (locationIds.length < 1) {
            return of(data);
          }

          // construct location query builder
          const qb = new RequestQueryBuilder();
          qb.filter.bySelect(
            'id',
            locationIds,
            false,
            null
          );

          // retrieve locations
          return this.locationDataService
            .getLocationsList(qb)
            .pipe(
              map((locations) => {
                // map locations
                const locationsMap: {
                  [locationId: string]: LocationModel
                } = {};
                locations.forEach((location) => {
                  locationsMap[location.id] = location;
                });

                // set locations
                data.forEach((item) => {
                  // initialize ?
                  if (!item.locations) {
                    item.locations = [];
                  }

                  // attach locations
                  item.locationIds.forEach((locationId) => {
                    if (locationsMap[locationId]) {
                      item.locations.push(locationsMap[locationId]);
                    }
                  });
                });

                // finished
                return data;
              })
            );
        })
      )
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

    // count
    this.teamDataService
      .getTeamsCount(countQueryBuilder)
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
  private exportTeams(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportData({
        title: {
          get: () => 'LNG_PAGE_LIST_TEAMS_EXPORT_TITLE'
        },
        export: {
          url: 'teams/export',
          async: true,
          method: ExportDataMethod.POST,
          fileName: `${ this.i18nService.instant('LNG_PAGE_LIST_TEAMS_TITLE') } - ${ momentOriginal().format('YYYY-MM-DD HH:mm') }`,
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
            anonymize: {
              fields: this.teamFields
            },
            fields: {
              options: this.teamFields
            },
            dbColumns: true,
            dbValues: true,
            jsonReplaceUndefinedWithNull: true
          }
        }
      });
  }
}
