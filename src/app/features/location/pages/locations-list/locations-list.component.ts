import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ErrorCodes } from '../../../../core/enums/error-codes.enum';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { LocationModel } from '../../../../core/models/location.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IV2Link, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2FilterText, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleLocation, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-locations-list',
  templateUrl: './locations-list.component.html'
})
export class LocationsListComponent extends ListComponent<LocationModel> implements OnDestroy {
  // parent location ID
  private _parentId: string;

  // parent tree
  private _parentLocationTree: HierarchicalLocationModel;
  pageTitle: string;

  // view action
  viewAction: IV2Link = {
    type: V2ActionType.LINK,
    action: {
      link: () => ['/locations', this._parentId, 'view']
    },
    visible: () => this._parentId &&
      LocationModel.canView(this.authUser)
  };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private locationDataService: LocationDataService,
    private activatedRoute: ActivatedRoute,
    private toastV2Service: ToastV2Service,
    private router: Router,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService,
      true
    );

    // get data
    this._parentId = this.activatedRoute.snapshot.params.parentId;
    this._parentLocationTree = this.activatedRoute.snapshot.data.parentLocationTree;
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
        // View Location
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_VIEW_LOCATION',
          action: {
            link: (item: LocationModel): string[] => {
              return ['/locations', item.id, 'view'];
            }
          },
          visible: (): boolean => {
            return LocationModel.canView(this.authUser);
          }
        },

        // Modify Location
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_MODIFY_LOCATION',
          action: {
            link: (item: LocationModel): string[] => {
              return ['/locations', item.id, 'modify'];
            }
          },
          visible: (): boolean => {
            return LocationModel.canModify(this.authUser);
          }
        },

        // View Location Children
        {
          type: V2ActionType.ICON,
          icon: 'group_work',
          iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_SEE_CHILDREN',
          action: {
            link: () => {
              return ['/redirect'];
            },
            linkQueryParams: (item: LocationModel) => {
              return {
                path: JSON.stringify(['/locations', item.id, 'children'])
              };
            }
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Location
            {
              label: {
                get: () => 'LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_LOCATION'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: LocationModel): void => {
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
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_LOCATION',
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

                    // delete record
                    this.locationDataService
                      .deleteLocation(item.id)
                      .pipe(
                        catchError((err: {
                          message: string,
                          code: ErrorCodes,
                          details: {
                            id: string,
                            model: string
                          }
                        }) => {
                          // hide loading
                          loading.close();

                          // check if we have a model in use error
                          if (err.code === ErrorCodes.MODEL_IN_USE) {
                            this.dialogV2Service.showConfirmDialog({
                              config: {
                                title: {
                                  get: () => 'LNG_DIALOG_LIST_LOCATIONS_IN_USE_LOCATION_DIALOG_TITLE',
                                  data: () => ({
                                    name: item.name
                                  })
                                },
                                message: {
                                  get: () => 'LNG_DIALOG_CONFIRM_LOCATION_USED',
                                  data: () => ({
                                    name: item.name
                                  })
                                }
                              }
                            }).subscribe((answer) => {
                              // canceled ?
                              if (answer.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                                // finished
                                return;
                              }

                              // redirect to usage page where we can make changes
                              this.router.navigate(['/locations', err.details.id, 'usage']);
                            });
                          } else {
                            // show error
                            this.toastV2Service.error(err);
                          }

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.toastV2Service.success('LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (): boolean => {
                return LocationModel.canDelete(this.authUser);
              }
            },

            // Divider
            {
              visible: (): boolean => {
                // visible only if at least one of the previous...
                return LocationModel.canDelete(this.authUser);
              }
            },

            // See Location usage
            {
              label: {
                get: () => 'LNG_PAGE_LIST_LOCATIONS_ACTION_USAGE'
              },
              action: {
                link: (item: LocationModel) => {
                  return ['/locations', item.id, 'usage'];
                }
              },
              visible: (): boolean => {
                return LocationModel.canListUsage(this.authUser);
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
        label: 'LNG_LOCATION_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'synonyms',
        label: 'LNG_LOCATION_FIELD_LABEL_SYNONYMS',
        format: {
          type: 'synonymsAsString'
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'identifiersAsString',
        label: 'LNG_LOCATION_FIELD_LABEL_IDENTIFIERS',
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          search: (column: IV2Column) => {
            // value
            const value: string = (column.filter as IV2FilterText).value;

            // remove previous condition
            this.queryBuilder.filter.remove('identifiers');
            if (!_.isEmpty(value)) {
              // add new condition
              this.queryBuilder.filter.where({
                identifiers: {
                  elemMatch: {
                    code: {
                      $regex: RequestFilter.escapeStringForRegex(value)
                        .replace(/%/g, '.*')
                        .replace(/\\\?/g, '.'),
                      $options: 'i'
                    }
                  }
                }
              });
            }

            // refresh list
            this.needsRefreshList();
          }
        }
      },
      {
        field: 'latLng',
        label: 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION',
        format: {
          type: (item: LocationModel) => item.geoLocation && item.geoLocation.lat ?
            item.geoLocation.lat + ', ' + item.geoLocation.lng :
            ''
        }
      },
      {
        field: 'active',
        label: 'LNG_LOCATION_FIELD_LABEL_ACTIVE',
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'populationDensity',
        label: 'LNG_LOCATION_FIELD_LABEL_POPULATION_DENSITY',
        sortable: true,
        filter: {
          type: V2FilterType.NUMBER_RANGE
        }
      },
      {
        field: 'geographicalLevelId',
        label: 'LNG_LOCATION_FIELD_LABEL_GEOGRAPHICAL_LEVEL',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_LOCATION_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.createdBy && this.activatedRoute.snapshot.data.user.map[item.createdBy] ?
            this.activatedRoute.snapshot.data.user.map[item.createdBy].name :
            ''
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
          return data.createdBy ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_LOCATION_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_LOCATION_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.updatedBy && this.activatedRoute.snapshot.data.user.map[item.updatedBy] ?
            this.activatedRoute.snapshot.data.user.map[item.updatedBy].name :
            ''
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
          return data.updatedBy ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_LOCATION_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
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
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return LocationModel.canView(this.authUser) || (
          !this._parentId &&
          !this.appliedListFilter &&
          (
            LocationModel.canExport(this.authUser) ||
            LocationModel.canImport(this.authUser)
          )
        );
      },
      menuOptions: [
        // Find location
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LOCATIONS_ACTION_FIND_LOCATION'
          },
          action: {
            click: () => {
              this.dialogV2Service
                .showSideDialog({
                  title: {
                    get: () => 'LNG_PAGE_LIST_LOCATIONS_ACTION_FIND_LOCATION'
                  },
                  hideInputFilter: true,
                  inputs: [{
                    type: V2SideDialogConfigInputType.LOCATION_SINGLE,
                    name: 'locationId',
                    placeholder: 'LNG_PAGE_LIST_LOCATIONS_ACTION_FIND_LOCATION',
                    value: undefined,
                    useOutbreakLocations: false,
                    validators: {
                      required: () => true
                    }
                  }],
                  bottomButtons: [{
                    type: IV2SideDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_VIEW',
                    color: 'primary',
                    disabled: (_data, handler): boolean => {
                      return !handler.form || handler.form.invalid;
                    }
                  }, {
                    type: IV2SideDialogConfigButtonType.CANCEL,
                    label: 'LNG_COMMON_BUTTON_CANCEL',
                    color: 'text'
                  }]
                })
                .subscribe((response) => {
                  // cancelled ?
                  if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // close dialog
                  response.handler.hide();

                  // redirect
                  const locationId: string = (response.data.map.locationId as IV2SideDialogConfigInputSingleLocation).value;
                  this.router.navigate(['/locations', locationId, 'view']);
                });
            }
          },
          visible: () => LocationModel.canView(this.authUser)
        },

        // Divider
        {
          visible: () => LocationModel.canView(this.authUser)
        },

        // Export hierarchical locations
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LOCATIONS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.dialogV2Service
                .showExportData({
                  title: {
                    get: () => 'LNG_PAGE_LIST_LOCATIONS_EXPORT_TITLE'
                  },
                  export: {
                    url: 'locations/hierarchical/export',
                    async: false,
                    method: ExportDataMethod.GET,
                    fileName: `${ this.i18nService.instant('LNG_PAGE_LIST_LOCATIONS_TITLE') } - ${ moment().format('YYYY-MM-DD') }`,
                    allow: {
                      types: [ExportDataExtension.JSON]
                    }
                  }
                });
            }
          },
          visible: (): boolean => {
            return !this._parentId &&
              !this.appliedListFilter &&
              LocationModel.canExport(this.authUser);
          }
        },

        // Import hierarchical locations
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LOCATIONS_IMPORT_HIERARCHICAL_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'hierarchical-locations', 'import']
          },
          visible: (): boolean => {
            return !this._parentId &&
              !this.appliedListFilter &&
              LocationModel.canImport(this.authUser);
          }
        },

        // Import locations
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LOCATIONS_IMPORT_LOCATIONS_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'location-data', 'import']
          },
          visible: (): boolean => {
            return !this._parentId &&
              !this.appliedListFilter &&
              LocationModel.canImport(this.authUser);
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
        link: (): string[] => this._parentId ?
          ['/locations', this._parentId, 'create'] :
          ['/locations', 'create']
      },
      visible: (): boolean => {
        return LocationModel.canCreate(this.authUser);
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
  protected initializeBreadcrumbs(): void {
    // dashboard
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

    // list parents ?
    this.pageTitle = 'LNG_PAGE_LIST_LOCATIONS_TITLE';
    if (!this._parentLocationTree) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: null
      });
    } else {
      // root
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: {
          link: ['/locations']
        }
      });

      // add tree
      let tree: HierarchicalLocationModel = this._parentLocationTree;
      while (tree) {
        // add to list
        if (tree.location?.id) {
          // parent category ?
          const isParent: boolean = !(tree.children?.length > 0);

          // update page title
          if (isParent) {
            this.pageTitle = tree.location.name;
          }

          // add to list
          this.breadcrumbs.push({
            label: tree.location.name,
            action: isParent ?
              null :
              {
                link: ['/redirect'],
                linkQueryParams: {
                  path: JSON.stringify(['/locations', tree.location.id, 'children'])
                }
              }
          });
        }

        // next
        tree = tree.children?.length > 0 ?
          tree.children[0] :
          undefined;
      }
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the list of Locations
   */
  refreshList() {
    // refresh
    this.records$ = this.locationDataService
      .getLocationsListByParent(
        this._parentId,
        this.queryBuilder
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

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.locationDataService
      .getLocationsCountByParent(
        this._parentId,
        countQueryBuilder
      )
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
