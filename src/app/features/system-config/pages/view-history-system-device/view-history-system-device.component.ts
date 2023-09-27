import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceDataService } from '../../../../core/services/data/device.data.service';
import { DeviceHistoryModel } from '../../../../core/models/device-history.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { DeviceModel } from '../../../../core/models/device.model';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { Observable } from 'rxjs';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { map, takeUntil } from 'rxjs/operators';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import * as _ from 'lodash';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-view-history-system-device',
  templateUrl: './view-history-system-device.component.html'
})
export class ViewHistorySystemDeviceComponent extends CreateViewModifyComponent<DeviceHistoryModel> implements OnDestroy {
  // data
  private _devicesHistoryValues: string[] = [];
  private _devicesHistoryPlaceholders: string[] = [];
  private _deviceId: string;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    protected toastV2Service: ToastV2Service,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected i18nService: I18nService,
    private deviceDataService: DeviceDataService
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // get deviceId
    this._deviceId = this.activatedRoute.snapshot.params.deviceId;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): DeviceHistoryModel {
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: DeviceHistoryModel): Observable<DeviceHistoryModel> {
    // view other device history?
    this._deviceId = record?.id ?? this._deviceId;

    // retrieve data
    return new Observable((subscriber) => {
      this.deviceDataService.getHistoryDevice(this._deviceId)
        .subscribe((results) => {
          this._devicesHistoryPlaceholders = [];
          this._devicesHistoryValues = results.map((item) => {
            // format status
            this._devicesHistoryPlaceholders.push(
              item.status ?
                this.i18nService.instant(item.status) :
                ''
            );

            // format createdAt
            return item.createdAt ?
              LocalizationHelper.toMoment(item.createdAt).format(this.Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
              '';
          });

          // finish
          subscriber.next(null);
          subscriber.complete();
        });
    });
  }

  /**
  * Data initialized
  */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // view history
    this.pageTitle = 'LNG_PAGE_VIEW_SYSTEM_DEVICE_HISTORY_TITLE';
    this.pageTitleData = null;
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsDetails()
      ],

      // create details
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: undefined,
      redirectAfterCreateUpdate: undefined
    };
  }

  /**
  * Initialize tabs - Details
  */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.LIST,
              name: 'history',
              cssClasses: 'gd-create-view-modify-bottom-section-content-input-has-list-one-line-item',
              items: this._devicesHistoryValues,
              readonly: true,
              itemsChanged: undefined,
              definition: {
                add: undefined,
                remove: undefined,
                input: {
                  type: CreateViewModifyV2TabInputType.LIST_TEXT,
                  placeholder: (_input, _parentInput, index) => {
                    return this._devicesHistoryPlaceholders[index];
                  }
                }
              }
            }
          ]
        }
      ]
    };
  }

  /**
  * Initialize buttons
  */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: undefined,
      modify: undefined,
      createCancel: undefined,
      viewCancel: {
        link: {
          link: () => ['/system-config/devices']
        }
      },
      modifyCancel: undefined,
      quickActions: undefined
    };
  }

  /**
  * Initialize expand list column renderer fields
  */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: DeviceModel) => ['/system-config/devices', item.id, 'view'],
      get: {
        text: (item: DeviceModel) => item.name
      }
    };
  }

  /**
  * Initialize expand list query fields
  */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
  * Initialize expand list advanced filters
  */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = DeviceModel.generateAdvancedFilters({
      options: {
        deviceStatus: _.values(this.Constants.DEVICE_WIPE_STATUS)
      }
    });
  }

  /**
  * Refresh expand list
  */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.deviceDataService
      .getDevices(data.queryBuilder)
      .pipe(
        // map to device model
        map((items) => {
          // trick eslint
          return (items || []).map((item) => item as any);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
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

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}
}
