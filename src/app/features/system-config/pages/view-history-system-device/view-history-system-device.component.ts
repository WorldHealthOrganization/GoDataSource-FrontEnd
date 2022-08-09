import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceHistoryModel } from '../../../../core/models/device-history.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { DeviceModel } from '../../../../core/models/device.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';

@Component({
  selector: 'app-view-history-system-device',
  templateUrl: './view-history-system-device.component.html'
})
export class ViewHistorySystemDeviceComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  deviceHistoryList: DeviceHistoryModel[];

  authUser: UserModel;

  deviceId: string;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private deviceDataService: DeviceDataService,
    private authDataService: AuthDataService,
    private dialogV2Service: DialogV2Service
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // show loading
    const loading = this.dialogV2Service.showLoadingDialog();

    // retrieve query params
    this.route.params
      .subscribe((params: { deviceId }) => {
        this.deviceId = params.deviceId;
        this.deviceDataService.getHistoryDevice(this.deviceId)
          .subscribe( (results) => {
            this.deviceHistoryList = results;

            // hide loading
            loading.close();
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
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // contacts list page
    if (DeviceModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE',
        action: {
          link: ['/system-config/devices']
        }
      });
    }

    // current page breadcrumb
    this.breadcrumbs.push({
      label: 'LNG_PAGE_VIEW_SYSTEM_DEVICE_HISTORY_TITLE',
      action: null
    });
  }
}
