import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserSettings } from '../../../../core/models/user.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Observable, throwError } from 'rxjs';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceModel } from '../../../../core/models/device.model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { catchError, share } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-system-devices-list',
  templateUrl: './system-devices.component.html'
})
export class SystemDevicesComponent extends ListComponent implements OnInit, OnDestroy {
  // Breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_DEVICES_TITLE', '.', true)
  // ];

  devicesList$: Observable<DeviceModel[]>;
  devicesListCount$: Observable<IBasicCount>;

  // constants
  UserSettings = UserSettings;

  recordActions: HoverRowAction[] = [
    // View Device
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_VIEW',
      linkGenerator: (item: DeviceModel): string[] => {
        return ['/system-config', 'devices', item.id, 'view'];
      },
      visible: (): boolean => {
        return DeviceModel.canView(this.authUser);
      }
    }),

    // Modify Device
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_MODIFY',
      linkGenerator: (item: DeviceModel): string[] => {
        return ['/system-config', 'devices', item.id, 'modify'];
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
          visible: (): boolean => {
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
          visible: (): boolean => {
            return DeviceModel.canListHistory(this.authUser);
          }
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
    private deviceDataService: DeviceDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // initialize Side Table Columns
    this.initializeTableColumns();

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
    super.onDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'physicalDeviceId',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_PHYSICAL_DEVICE_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'manufacturer',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MANUFACTURER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'model',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MODEL'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'os',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_OPERATING_SYSTEM'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'status',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_STATUS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'lastSeen',
    //     label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_LAST_SEEN'
    //   })
    // ];
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
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList() {
    this.devicesList$ = this.deviceDataService
      .getDevices(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
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
          this.toastV2Service.error(err);
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
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_DEVICE', device)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // this.showLoadingDialog();
          this.deviceDataService
            .deleteDevice(device.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                // this.closeLoadingDialog();
                return throwError(err);
              })
            )
            .subscribe( () => {
              this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_DEVICES_ACTION_DELETE_SUCCESS_MESSAGE');

              this.needsRefreshList();
              // this.closeLoadingDialog();
            });
        }
      });

  }

  /**
     * Wipes a device
     * @param {DeviceModel} device
     */
  wipeDevice(device: DeviceModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_WIPE_DEVICE', device)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // this.showLoadingDialog();
          this.deviceDataService
            .wipeDevice(device.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                // this.closeLoadingDialog();
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.needsRefreshList();
              // this.closeLoadingDialog();
            });
        }
      });
  }
}
