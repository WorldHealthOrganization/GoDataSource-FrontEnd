import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { IQuickEditorV2Handlers, IQuickEditorV2Section, QuickEditorV2Input, QuickEditorV2InputType } from './models/input.model';
import { ControlContainer, NgForm } from '@angular/forms';
import { Subscription, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';

/**
 * Component
 */
@Component({
  selector: 'app-quick-editor-v2',
  templateUrl: './app-quick-editor-v2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm } ]
})
export class AppQuickEditorV2Component implements OnDestroy {
  // setup
  private _quick: IQuickEditorV2Handlers<any, QuickEditorV2Input>;
  @Input() set quick(quick: IQuickEditorV2Handlers<any, QuickEditorV2Input>) {
    // set data
    this._quick = quick;

    // trigger data retrieval
    this.retrieveData();
  }

  // resource retrieval
  private _recordSubscription: Subscription;
  loading: boolean = true;

  // inputs
  sections: IQuickEditorV2Section<QuickEditorV2Input>[];

  // constants
  QuickEditorV2InputType = QuickEditorV2InputType;

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
    // stop record retrieval
    this.stopGetRecord();
  }

  /**
   * Update UI
   */
  private detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Stop retrieving data
   */
  private stopGetRecord(): void {
    // stop retrieving data
    if (this._recordSubscription) {
      this._recordSubscription.unsubscribe();
      this._recordSubscription = undefined;
    }
  }

  /**
   * Retrieve data
   */
  private retrieveData(): void {
    // cancel previous one
    this.stopGetRecord();

    // nothing to do ?
    if (!this._quick?.record$) {
      // reset data
      this.sections = [];

      // re-render page
      this.detectChanges();

      // finished
      return;
    }

    // show loading
    this.loading = true;

    // re-render page
    this.detectChanges();

    // retrieve data
    this._recordSubscription = this._quick.record$
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe((data) => {
        // finished
        this._recordSubscription = undefined;

        // set data & hide loading overlay
        this.sections = this._quick.definitions(data);

        // hide loading
        this.loading = false;

        // re-render page
        this.detectChanges();
      });
  }
}
