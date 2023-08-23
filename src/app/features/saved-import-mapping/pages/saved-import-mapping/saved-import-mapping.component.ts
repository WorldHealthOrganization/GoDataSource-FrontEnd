import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { SavedImportMappingModel } from '../../../../core/models/saved-import-mapping.model';
import { UserModel } from '../../../../core/models/user.model';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-saved-import-mapping',
  templateUrl: './saved-import-mapping.component.html'
})
export class SavedImportMappingComponent extends ListComponent<SavedImportMappingModel, IV2Column> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private savedImportMappingService: SavedImportMappingService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService, {
        disableWaitForSelectedOutbreakToRefreshList: true
      }
    );
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
        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Saved Filter
            {
              label: {
                get: () => 'LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_DELETE_MAPPING'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: SavedImportMappingModel): void => {
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
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_SAVED_IMPORT_MAPPING',
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

                    // delete saved import mapping
                    this.savedImportMappingService.deleteImportMapping(item.id)
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
                        this.toastV2Service.success('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: SavedImportMappingModel): boolean => {
                return !item.readOnly || SavedImportMappingModel.canDelete(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: SavedImportMappingModel): boolean => {
                return !item.readOnly || (
                  SavedImportMappingModel.canDelete(this.authUser) &&
                  SavedImportMappingModel.canModify(this.authUser)
                );
              }
            },

            // Change Public
            {
              label: {
                get: () => 'LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_CHANGE_PUBLIC'
              },
              action: {
                click: (item: SavedImportMappingModel) => {
                  this.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_CHANGE_PUBLIC_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.DIVIDER,
                          placeholder: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_IS_PUBLIC'
                        },
                        {
                          type: V2SideDialogConfigInputType.TOGGLE,
                          value: item.isPublic ?
                            Constants.FILTER_YES_NO_OPTIONS.YES.value :
                            Constants.FILTER_YES_NO_OPTIONS.NO.value,
                          name: 'public',
                          options: [
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.YES.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.YES.value
                            },
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.NO.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.NO.value
                            }
                          ]
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.isPublic === ((handler.data.map.public as IV2SideDialogConfigInputToggle).value) as boolean;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change public
                      this.savedImportMappingService.modifyImportMapping(item.id, { isPublic: (response.handler.data.map.public as IV2SideDialogConfigInputToggle).value })
                        .pipe(
                          catchError((err) => {
                            this.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // update our record too
                          item.isPublic = ((response.handler.data.map.public as IV2SideDialogConfigInputToggle).value) as boolean;

                          // success message
                          this.toastV2Service.success('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // refresh list
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (item: SavedImportMappingModel): boolean => {
                return !item.readOnly || SavedImportMappingModel.canModify(this.authUser);
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
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'isPublic',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_IS_PUBLIC',
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
        field: 'mappingKey',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_FOR_PAGE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: Object.values(Constants.APP_IMPORT_PAGE).map((item) => ({
            label: item.label,
            value: item.value
          }))
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_CREATED_BY',
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
          return data.createdBy && UserModel.canView(this.authUser) ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_UPDATED_BY',
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
          return data.updatedBy && UserModel.canView(this.authUser) ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_UPDATED_AT',
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
  protected initializeQuickActions(): void {}

  /**
  * Initialize table group actions
  */
  protected initializeGroupActions(): void {}

  /**
  * Initialize table add action
  */
  protected initializeAddAction(): void {}

  /**
  * Initialize table grouped data
  */
  protected initializeGroupedData(): void {}

  /**
  * Initialize breadcrumbs
  */
  protected initializeBreadcrumbs(): void {
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
        label: 'LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_TITLE',
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
      'isPublic',
      'mappingKey',
      'createdBy',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
  * Re(load) the Clusters list, based on the applied filter, sort criterias
  */
  refreshList() {
    // retrieve list
    this.records$ = this.savedImportMappingService
      .getImportMappingsList(this.queryBuilder)
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

    this.savedImportMappingService
      .getImportMappingsListCount(countQueryBuilder)
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
