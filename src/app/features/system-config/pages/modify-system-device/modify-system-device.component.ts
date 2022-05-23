import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DeviceModel } from '../../../../core/models/device.model';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-modify-system-device',
  templateUrl: './modify-system-device.component.html'
})
export class ModifySystemDeviceComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs: BreadcrumbItemModel[] = [];

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
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
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
        this.retrieveDeviceData();
      });
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // // reset
    // this.breadcrumbs = [];
    //
    // // add list breadcrumb only if we have permission
    // if (DeviceModel.canList(this.authUser)) {
    //   this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '/system-config/devices'));
    // }
    //
    // // view / modify breadcrumb
    // this.breadcrumbs.push(new BreadcrumbItemModel(
    //   this.viewOnly ?
    //     'LNG_PAGE_VIEW_SYSTEM_DEVICE_TITLE' :
    //     'LNG_PAGE_MODIFY_SYSTEM_DEVICE_TITLE',
    //   '.',
    //   true,
    //   {},
    //   this.deviceData
    // ));
  }

  /**
     * Device data
     */
  retrieveDeviceData() {
    // get device
    if (this.deviceId) {
      // show loading
      this.showLoadingDialog(false);

      this.deviceDataService
        .getDevice(this.deviceId)
        .subscribe( (device) => {
          this.deviceData = device;

          // update breadcrumbs
          this.initializeBreadcrumbs();

          // hide loading
          this.hideLoadingDialog();
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

    // show loading
    this.showLoadingDialog();

    // modify the Device
    this.deviceDataService
      .modifyDevice(this.deviceId, dirtyFields)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          // hide loading
          this.hideLoadingDialog();
          return throwError(err);
        })
      )
      .subscribe((modifiedDevice: DeviceModel) => {
        // update model
        this.deviceData = modifiedDevice;

        // mark form as pristine
        form.form.markAsPristine();

        // display message
        this.toastV2Service.success('LNG_PAGE_MODIFY_SYSTEM_DEVICE_ACTION_MODIFY_SYSTEM_DEVICE_SUCCESS_MESSAGE');

        // hide loading
        this.hideLoadingDialog();
      });
  }

}
