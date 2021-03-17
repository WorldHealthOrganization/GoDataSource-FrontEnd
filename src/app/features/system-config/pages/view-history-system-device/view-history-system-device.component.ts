import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceHistoryModel } from '../../../../core/models/device-history.model';
import { DeviceModel } from '../../../../core/models/device.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-view-history-system-device',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-history-system-device.component.html',
    styleUrls: ['./view-history-system-device.component.less']
})
export class ViewHistorySystemDeviceComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    deviceHistoryList: DeviceHistoryModel[];

    authUser: UserModel;

    deviceId: string;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        protected dialogService: DialogService,
        private deviceDataService: DeviceDataService,
        private authDataService: AuthDataService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // show loading
        this.showLoadingDialog(false);

        // retrieve query params
        this.route.params
            .subscribe((params: { deviceId }) => {
                this.deviceId = params.deviceId;
                this.deviceDataService.getHistoryDevice(this.deviceId)
                    .subscribe( (results) => {
                        this.deviceHistoryList = results;

                        // hide loading
                        this.hideLoadingDialog();
                    });

                // update breadcrumbs
                this.initializeBreadcrumbs();
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
