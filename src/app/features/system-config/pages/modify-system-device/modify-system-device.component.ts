import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DeviceModel } from '../../../../core/models/device.model';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';

@Component({
    selector: 'app-modify-system-device',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-system-device.component.html',
    styleUrls: ['./modify-system-device.component.less']
})
export class ModifySystemDeviceComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    deviceId: string;

    deviceData: DeviceModel = new DeviceModel();

    constructor(
        protected route: ActivatedRoute,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private deviceDataService: DeviceDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // retrieve query params
        this.route.params
            .subscribe((params: { deviceId }) => {
                this.deviceId = params.deviceId;
                this.retrieveDeviceData();
                this.buildBreadcrumbs();
            });
    }

    /**
     * Breadcrumbs
     */
    buildBreadcrumbs() {
        if (this.deviceData) {
            // initialize breadcrumbs
            this.breadcrumbs = [
                new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '/system-config/devices', false)
            ];

            // current page title
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_MODIFY_SYSTEM_DEVICE_TITLE',
                    '.',
                    true,
                    {},
                    this.deviceData
                )
            );
        }
    }

    /**
     * Device data
     */
    retrieveDeviceData() {
        // get device
        if (
            this.deviceId
        ) {
            this.deviceDataService
                .getDevice(this.deviceId)
                .subscribe( (device) => {
                       this.deviceData = device;
                });
        }
    }

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
            .catch((err) => {
                this.snackbarService.showApiError(err);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
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
