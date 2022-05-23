import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { DashletValueStatus, IDashletValue } from '../../helperClasses/dashlet-value';
import { ReplaySubject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-kpi-dashlet',
  templateUrl: './app-kpi-dashlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppKpiDashletComponent
implements OnDestroy {
  // handler for stopping take until
  private _destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

  // title
  @Input() title: string;

  // values
  private _values: IDashletValue[];
  @Input() set values(values: IDashletValue[]) {
    // set data
    this._values = values;

    // refresh
    this.refreshNecessary();
  }
  get values(): IDashletValue[] {
    return this._values;
  }

  // expanded / collapsed ?
  private _expanded: boolean = false;
  @Input() set expanded(expanded: boolean) {
    // set data
    this._expanded = expanded;

    // must initialize data ?
    this.refreshNecessary();
  }
  get expanded(): boolean {
    return this._expanded;
  }

  // constants
  DashletValueStatus = DashletValueStatus;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // unsubscribe other requests
    this._destroyed$.next(true);
    this._destroyed$.complete();
    this._destroyed$ = undefined;
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
  private refreshNecessary(): void {
    // nothing to do ?
    if (
      !this.values?.length ||
      !this.expanded
    ) {
      return;
    }

    // go through dashlet values and check if we need to load anything
    this.values.forEach((value) => {
      // nothing to do ?
      if (
        value.status === DashletValueStatus.LOADED ||
        value.status === DashletValueStatus.LOADING || (
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

      // load data
      value.subscription = value.refresh(value.inputValue !== undefined && typeof value.inputValue === 'string' ? parseInt(value.inputValue, 10) : value.inputValue)
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

      // change status
      value.status = undefined;

      // refresh
      this.refreshNecessary();
    }, 500);
  }
}
