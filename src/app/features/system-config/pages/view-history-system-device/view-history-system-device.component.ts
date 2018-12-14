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
import { DeviceHistoryModel } from '../../../../core/models/device-history.model';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-view-history-system-device',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-history-system-device.component.html',
    styleUrls: ['./view-history-system-device.component.less']
})
export class ViewHistorySystemDeviceComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    deviceHistoryList: DeviceHistoryModel[];

    deviceId: string;

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
                this.deviceDataService.getHistoryDevice(this.deviceId)
                    .subscribe( (results) => {
                        this.deviceHistoryList = results;
                    });
                this.buildBreadcrumbs();
            });
    }

    /**
     * Breadcrumbs
     */
    buildBreadcrumbs() {
        // initialize breadcrumbs
        this.breadcrumbs = [
            new BreadcrumbItemModel('LNG_PAGE_MAIN_SYSTEM_CONFIG_TITLE', '/system-config', false),
            new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '/system-config/system-devices', false)
        ];

        // current page title
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_VIEW_SYSTEM_DEVICE_HISTORY_TITLE',
                '.',
                true,
                {}
            )
        );
    }

}
