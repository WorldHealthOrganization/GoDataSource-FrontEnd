import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { DashletValueStatus, IDashletValue } from '../../helperClasses/dashlet-value';
import { ReplaySubject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { DashletSettingsModel, UserSettingsDashboardModel } from '../../../../core/models/user-settings-dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-kpi-dashlet',
  templateUrl: './app-kpi-dashlet.component.html',
  styleUrls: ['./app-kpi-dashlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppKpiDashletComponent
implements OnDestroy {
  // handler for stopping take until
  private _destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

  // used to filter dashlets - date
  private _globalFilterDate: string | Moment;
  @Input() set globalFilterDate(globalFilterDate: string | Moment) {
    // set data
    this._globalFilterDate = globalFilterDate;

    // wait to gather all data and refresh
    this.waitAndRefreshNecessary();
  }
  get globalFilterDate(): string | Moment {
    return this._globalFilterDate;
  }

  // used to filter dashlets - location
  private _globalFilterLocationId: string;
  @Input() set globalFilterLocationId(globalFilterLocationId: string) {
    // set data
    this._globalFilterLocationId = globalFilterLocationId;

    // wait to gather all data and refresh
    this.waitAndRefreshNecessary();
  }
  get globalFilterLocationId(): string {
    return this._globalFilterLocationId;
  }

  // used to filter dashlets - classification
  private _globalFilterClassificationId: string[];
  @Input() set globalFilterClassificationId(globalFilterClassificationId: string[]) {
    // set data
    this._globalFilterClassificationId = globalFilterClassificationId;

    // wait to gather all data and refresh
    this.waitAndRefreshNecessary();
  }
  get globalFilterClassificationId(): string[] {
    return this._globalFilterClassificationId;
  }

  // title
  @Input() pageTitle: string;

  // values
  hiddenValues: {
    count: number
  };
  private _values: IDashletValue[];
  private _valuesVisibleAndSorted: IDashletValue[];
  @Input() set values(values: IDashletValue[]) {
    // set data
    this._values = values;

    // filter values
    this._valuesVisibleAndSorted = (this._values || []).filter((value) => {
      return value.hasPermission() && (
        this.dashletMap[value.name] === undefined ||
        this.dashletMap[value.name].visible === undefined ||
        this.dashletMap[value.name].visible
      );
    });

    // sort values
    this._valuesVisibleAndSorted.sort((a, b) => {
      // determine order
      let aOrder: number = this.dashletMap[a.name]?.order !== undefined ?
        this.dashletMap[a.name].order :
        9999;

      // not number ?
      if (typeof aOrder === 'string') {
        aOrder = parseInt(aOrder, 10);
      }

      // determine order
      let bOrder: number = this.dashletMap[b.name]?.order !== undefined ?
        this.dashletMap[b.name].order :
        9999;

      // not number ?
      if (typeof bOrder === 'string') {
        bOrder = parseInt(bOrder, 10);
      }

      // sort
      return aOrder - bOrder;
    });

    // determine hidden no
    this.hiddenValues = {
      count: (this._values ? this._values.length : 0) - this._valuesVisibleAndSorted.length
    };

    // refresh
    this.refreshNecessary(false);
  }
  get valuesVisibleAndSorted(): IDashletValue[] {
    return this._valuesVisibleAndSorted;
  }

  // expanded / collapsed ?
  private _expanded: boolean = false;
  set expanded(expanded: boolean) {
    // set data
    this._expanded = expanded;

    // must initialize data ?
    this.refreshNecessary(false);

    // update ui
    this.detectChanges();
  }
  get expanded(): boolean {
    return this._expanded;
  }

  // timeout
  private _waitAndRefreshNecessary: number;

  // authenticated user data
  private _authUser: UserModel;
  protected dashletMap: {
    [key: string]: DashletSettingsModel
  } = {};

  // invalid drag zone
  private _isInvalidDragEvent: boolean = true;

  // constants
  DashletValueStatus = DashletValueStatus;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService
  ) {
    // get the authenticated user
    this._authUser = authDataService.getAuthenticatedUser();

    // retrieve dashlets settings
    const dashboardSettings: UserSettingsDashboardModel = this._authUser.getSettings(UserSettings.DASHBOARD);
    this.dashletMap = {};
    dashboardSettings.dashlets.forEach((dashlet) => {
      this.dashletMap[dashlet.name] = dashlet;
    });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // unsubscribe other requests
    this._destroyed$.next(true);
    this._destroyed$.complete();
    this._destroyed$ = undefined;

    // clear previous
    if (this._waitAndRefreshNecessary) {
      clearTimeout(this._waitAndRefreshNecessary);
      this._waitAndRefreshNecessary = undefined;
    }
  }

  /**
   * Update UI
   */
  private detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Refresh what is necessary
   */
  private waitAndRefreshNecessary(): void {
    // clear previous
    if (this._waitAndRefreshNecessary) {
      clearTimeout(this._waitAndRefreshNecessary);
      this._waitAndRefreshNecessary = undefined;
    }

    // wait
    this._waitAndRefreshNecessary = setTimeout(() => {
      // reset
      this._waitAndRefreshNecessary = undefined;

      // trigger update
      this.refreshNecessary(true);
    });
  }

  /**
   * Refresh what is necessary
   */
  private refreshNecessary(forceReload: boolean): void {
    // nothing to do ?
    if (
      !this.valuesVisibleAndSorted?.length ||
      !this.expanded
    ) {
      return;
    }

    // go through dashlet values and check if we need to load anything
    this.valuesVisibleAndSorted.forEach((value) => {
      // nothing to do ?
      if (
        (
          !forceReload && (
            value.status === DashletValueStatus.LOADED ||
            value.status === DashletValueStatus.LOADING
          )
        ) || (
          // invalid value ?
          value.suffix &&
          !value.inputValue
        )
      ) {
        return;
      }

      // top previous request if we're waiting for something
      if (value.subscription) {
        value.subscription.unsubscribe();
        value.subscription = undefined;
      }

      // update status
      value.status = DashletValueStatus.LOADING;

      // update link data
      const inputValue: number = value.inputValue !== undefined && typeof value.inputValue === 'string' ?
        parseInt(value.inputValue, 10) :
        value.inputValue;
      const linkDetails = value.getLink(
        inputValue,
        this.globalFilterDate,
        this.globalFilterLocationId,
        this.globalFilterClassificationId
      );
      if (linkDetails) {
        value.link = linkDetails.link;
        value.linkQueryParams = linkDetails.linkQueryParams;
      } else {
        value.link = undefined;
        value.linkQueryParams = undefined;
      }

      // load data
      value.subscription = value.refresh(
        inputValue,
        this.globalFilterDate,
        this.globalFilterLocationId,
        this.globalFilterClassificationId
      )
        .pipe(
          // error
          catchError((err) => {
            // error
            this.toastV2Service.error(err);

            // hide loading
            value.subscription = undefined;
            value.status = DashletValueStatus.ERROR;

            // send it further
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this._destroyed$)
        )
        .subscribe((response) => {
          // finished
          value.subscription = undefined;

          // process
          value.value = value.process(response);

          // update status
          value.status = DashletValueStatus.LOADED;

          // update ui
          this.detectChanges();
        });
    });

    // update ui - show loading
    this.detectChanges();
  }

  /**
   * Reload value
   */
  reloadValue(value: IDashletValue): void {
    // wait a little
    if (value.reload) {
      clearTimeout(value.reload);
      value.reload = undefined;
    }

    // stop if we have an invalid value
    if (!value.inputValue) {
      return;
    }

    // wait
    value.reload = setTimeout(() => {
      // reset
      value.reload = undefined;

      // force reload
      value.status = undefined;

      // refresh
      this.refreshNecessary(false);
    }, 500);
  }

  /**
   * Started the drag from a zone that isn't allowed
   */
  notInvalidDragZone(): void {
    this._isInvalidDragEvent = false;
  }

  /**
   * Drop item
   */
  dropItem(event: CdkDragDrop<any[]>): void {
    // stop ?
    if (this._isInvalidDragEvent) {
      return;
    }

    // disable drag
    this._isInvalidDragEvent = true;
    moveItemInArray(
      this.valuesVisibleAndSorted,
      event.previousIndex,
      event.currentIndex
    );

    // update order
    this.valuesVisibleAndSorted.forEach((value, valueIndex) => {
      // update
      if (!this.dashletMap[value.name]) {
        this.dashletMap[value.name] = new DashletSettingsModel({
          name: value.name,
          order: valueIndex,
          visible: true,
          kpiGroup: value.group
        });
      } else {
        this.dashletMap[value.name].order = valueIndex;
      }
    });

    // update
    this.updateUserSettings();

    // update ui
    this.detectChanges();
  }

  /**
   * Drag started
   */
  dragStarted(): void {
    // stop ?
    if (this._isInvalidDragEvent) {
      document.dispatchEvent(new Event('mouseup'));
    }
  }

  /**
   * Hide
   */
  hide(value: IDashletValue): void {
    // update visibility
    this.valuesVisibleAndSorted.forEach((childValue, valueIndex) => {
      // update
      if (!this.dashletMap[childValue.name]) {
        this.dashletMap[childValue.name] = new DashletSettingsModel({
          name: childValue.name,
          order: valueIndex,
          visible: childValue.name !== value.name,
          kpiGroup: childValue.group
        });
      } else if (childValue.name === value.name) {
        this.dashletMap[childValue.name].visible = false;
      }
    });

    // update visible items
    this.values = this._values;

    // update
    this.updateUserSettings();

    // update ui
    this.detectChanges();
  }

  /**
   * Update user settings
   */
  private updateUserSettings(): void {
    // get user settings
    const dashboardSettings: UserSettingsDashboardModel = this._authUser.getSettings(UserSettings.DASHBOARD);
    const localDashletMap: {
      [key: string]: DashletSettingsModel
    } = {};
    dashboardSettings.dashlets.forEach((dashlet) => {
      localDashletMap[dashlet.name] = dashlet;
    });

    // check for missing dashlets & update order
    Object.keys(this.dashletMap).forEach((dashletName) => {
      // get updated dashlet
      const newDashlet = this.dashletMap[dashletName];

      // missing ?
      if (!localDashletMap[newDashlet.name]) {
        dashboardSettings.dashlets.push(newDashlet);
      } else {
        localDashletMap[newDashlet.name].visible = newDashlet.visible;
        localDashletMap[newDashlet.name].order = newDashlet.order;
      }
    });

    // send update request
    this.authDataService
      .updateSettingsForCurrentUser({
        [UserSettings.DASHBOARD]: dashboardSettings
      })
      .pipe(
        // error
        catchError((err) => {
          // error
          this.toastV2Service.error(err);

          // send it further
          return throwError(err);
        })

        // should be the last pipe
        // - no take until needed so we don't stop it if we leave the page
        // takeUntil(this._destroyed$)
      )
      .subscribe();
  }

  /**
   * Show all dashlets
   */
  showAll(): void {
    // update visibility
    this._values.forEach((childValue, valueIndex) => {
      // update
      if (!this.dashletMap[childValue.name]) {
        this.dashletMap[childValue.name] = new DashletSettingsModel({
          name: childValue.name,
          order: valueIndex,
          visible: true,
          kpiGroup: childValue.group
        });
      } else {
        this.dashletMap[childValue.name].visible = true;
        this.dashletMap[childValue.name].order = valueIndex;
      }
    });

    // update visible items
    this.values = this._values;

    // update
    this.updateUserSettings();

    // update ui
    this.detectChanges();
  }
}
