import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceModel } from '../../../../core/models/device.model';

@Component({
    selector: 'app-system-devices-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-devices.component.html',
    styleUrls: ['./system-devices.component.less']
})
export class SystemDevicesComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_MAIN_SYSTEM_CONFIG_TITLE', '/system-config', false),
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    devicesList$: Observable<DeviceModel[]>;

    // constants
    UserSettings = UserSettings;

    loadingDialog: LoadingDialogModel;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private deviceDataService: DeviceDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // retrieve devices
        this.needsRefreshList(true);
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

        // actions
        this.tableColumns.push(
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        );
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.devicesList$ = this.deviceDataService.getDevices();
    }

    /**
     * Check if we have write access to sys settings
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Deletes a device
      * @param {DeviceModel} device
     */
    deleteDevice(device: DeviceModel) {
        this.showLoadingDialog();
        this.deviceDataService
            .deleteDevice(device.id)
            .catch((err) => {
                this.snackbarService.showApiError(err);
                this.closeLoadingDialog();
                return ErrorObservable.create(err);
            })
            .subscribe( () => {
               this.needsRefreshList();
               this.closeLoadingDialog();
            });
    }

    /**
     * Wipes a device
     * @param {DeviceModel} device
     */
    wipeDevice(device: DeviceModel) {
        this.showLoadingDialog();
        this.deviceDataService
            .wipeDevice(device.id)
            .catch((err) => {
                this.snackbarService.showApiError(err);
                this.closeLoadingDialog();
                return ErrorObservable.create(err);
            })
            .subscribe( () => {
                this.needsRefreshList();
                this.closeLoadingDialog();
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
