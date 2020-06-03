import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Observable } from 'rxjs';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceModel } from '../../../../core/models/device.model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { throwError } from 'rxjs';
import { catchError, share, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-system-devices-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-devices.component.html',
    styleUrls: ['./system-devices.component.less']
})
export class SystemDevicesComponent extends ListComponent implements OnInit, OnDestroy {
    // Breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    devicesList$: Observable<DeviceModel[]>;
    devicesListCount$: Observable<IBasicCount>;

    // constants
    UserSettings = UserSettings;

    loadingDialog: LoadingDialogModel;

    recordActions: HoverRowAction[] = [
        // View Device
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_VIEW',
            click: (item: DeviceModel) => {
                this.router.navigate(['/system-config', 'devices', item.id, 'view']);
            },
            visible: (): boolean => {
                return DeviceModel.canView(this.authUser);
            }
        }),

        // Modify Device
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_MODIFY',
            click: (item: DeviceModel) => {
                this.router.navigate(['/system-config', 'devices', item.id, 'modify']);
            },
            visible: (): boolean => {
                return DeviceModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Device
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_DELETE',
                    click: (item: DeviceModel) => {
                        this.deleteDevice(item);
                    },
                    visible: (): boolean => {
                        return DeviceModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (): boolean => {
                        // visible only if at least one of the previous...
                        return DeviceModel.canDelete(this.authUser);
                    }
                }),

                // Wipe Device
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_WIPE',
                    click: (item: DeviceModel) => {
                        this.wipeDevice(item);
                    },
                    visible: (item: DeviceModel): boolean => {
                        // for now let use do another wipe even if one is in progress, because parse might fails..and status might remain pending..which might cause issues if we can't send a new notification
                        // [Constants.DEVICE_WIPE_STATUS.READY.value, Constants.DEVICE_WIPE_STATUS.PENDING.value].includes(item.status)
                        return DeviceModel.canWipe(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // View Device History
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_VIEW_HISTORY',
                    click: (item: DeviceModel) => {
                        this.router.navigate(['/system-config', 'devices', item.id, 'history']);
                    },
                    visible: (item: DeviceModel): boolean => {
                        return DeviceModel.canListHistory(this.authUser);
                    },
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private authDataService: AuthDataService,
        private deviceDataService: DeviceDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize pagination
        this.initPaginator();

        // retrieve devices
        this.needsRefreshList(true);
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'physicalDeviceId',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_PHYSICAL_DEVICE_ID'
            }),
            new VisibleColumnModel({
                field: 'manufacturer',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MANUFACTURER'
            }),
            new VisibleColumnModel({
                field: 'model',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MODEL'
            }),
            new VisibleColumnModel({
                field: 'os',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_OPERATING_SYSTEM'
            }),
            new VisibleColumnModel({
                field: 'status',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_STATUS'
            }),
            new VisibleColumnModel({
                field: 'lastSeen',
                label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_LAST_SEEN'
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        this.devicesList$ = this.deviceDataService
            .getDevices(this.queryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.devicesListCount$ = this.deviceDataService
            .getDevicesCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    /**
     * Deletes a device
      * @param {DeviceModel} device
     */
    deleteDevice(device: DeviceModel) {
        this.dialogService.showConfirm(`LNG_DIALOG_CONFIRM_DELETE_DEVICE`, device)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.showLoadingDialog();
                    this.deviceDataService
                        .deleteDevice(device.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                this.closeLoadingDialog();
                                return throwError(err);
                            })
                        )
                        .subscribe( () => {
                            this.snackbarService.showSuccess(`LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_DELETE_SUCCESS_MESSAGE`);

                            this.needsRefreshList();
                            this.closeLoadingDialog();
                        });
                }
            });

    }

    /**
     * Wipes a device
     * @param {DeviceModel} device
     */
    wipeDevice(device: DeviceModel) {
        this.dialogService.showConfirm(`LNG_DIALOG_CONFIRM_WIPE_DEVICE`, device)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.showLoadingDialog();
                    this.deviceDataService
                        .wipeDevice(device.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                this.closeLoadingDialog();
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.needsRefreshList();
                            this.closeLoadingDialog();
                        });
                }
            });
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
