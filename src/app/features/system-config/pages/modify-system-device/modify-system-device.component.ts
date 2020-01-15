import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DeviceModel } from '../../../../core/models/device.model';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-modify-system-device',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-system-device.component.html',
    styleUrls: ['./modify-system-device.component.less']
})
export class ModifySystemDeviceComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    DeviceModel = DeviceModel;

    deviceId: string;

    authUser: UserModel;

    deviceData: DeviceModel = new DeviceModel();

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private deviceDataService: DeviceDataService,
        private authDataService: AuthDataService
    ) {
        super(route);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve query params
        this.route.params
            .subscribe((params: { deviceId }) => {
                this.deviceId = params.deviceId;
                this.retrieveDeviceData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (DeviceModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '/system-config/devices'));
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel(
            this.viewOnly ?
                'LNG_PAGE_VIEW_SYSTEM_DEVICE_TITLE' :
                'LNG_PAGE_MODIFY_SYSTEM_DEVICE_TITLE',
            '.',
            true,
            {},
            this.deviceData
        ));
    }

    /**
     * Device data
     */
    retrieveDeviceData() {
        // get device
        if (this.deviceId) {
            this.deviceDataService
                .getDevice(this.deviceId)
                .subscribe( (device) => {
                    this.deviceData = device;

                    // update breadcrumbs
                    this.initializeBreadcrumbs();
                });
        }
    }

    /**
     * Modify device
     */
    modifyDevice(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // modify the Device
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.deviceDataService
            .modifyDevice(this.deviceId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((modifiedDevice: DeviceModel) => {
                // update model
                this.deviceData = modifiedDevice;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_SYSTEM_DEVICE_ACTION_MODIFY_SYSTEM_DEVICE_SUCCESS_MESSAGE');

                // hide dialog
                loadingDialog.close();
            });
    }

}
