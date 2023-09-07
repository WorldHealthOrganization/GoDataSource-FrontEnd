import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { IQuickEditorV2Handlers, IQuickEditorV2InputSingleSelect, IQuickEditorV2Section, QuickEditorV2Input, QuickEditorV2InputType } from './models/input.model';
import { ControlContainer, NgForm } from '@angular/forms';
import { forkJoin, Observable, Subscription, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';

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
  private _optionsSubscription: Subscription;
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

    // top retrieving options
    this.stopGetOptions();
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
   * Stop retrieving options
   */
  private stopGetOptions(): void {
    // stop retrieving data
    if (this._optionsSubscription) {
      this._optionsSubscription.unsubscribe();
      this._optionsSubscription = undefined;
    }
  }

  /**
   * Retrieve data
   */
  private retrieveData(): void {
    // cancel previous one
    this.stopGetRecord();

    // top retrieving options
    this.stopGetOptions();

    // show loading
    this.loading = true;

    // reset data
    this.sections = [];

    // re-render page
    this.detectChanges();

    // nothing to do ?
    if (!this._quick?.record$) {
      // finished
      return;
    }

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

        // do we have any options to load ?
        const optionsToLoadSelects: IQuickEditorV2InputSingleSelect[] = [];
        this.sections.forEach((section) => {
          section.inputs.forEach((input) => {
            // nothing to do ?
            if (input.type !== QuickEditorV2InputType.SELECT_SINGLE) {
              return;
            }

            // do we need to load data ?
            if (input.optionsLoad) {
              optionsToLoadSelects.push(input);
            }
          });
        });

        // top retrieving options
        this.stopGetOptions();

        // finished ?
        if (optionsToLoadSelects.length < 1) {
          // hide loading
          this.loading = false;

          // re-render page
          this.detectChanges();
        } else {
          // load options
          this._optionsSubscription = forkJoin(
            optionsToLoadSelects.map((optionLoad) => {
              return new Observable<ILabelValuePairModel[]>((observer) => {
                optionLoad.optionsLoad((options) => {
                  observer.next(options);
                  observer.complete();
                });
              });
            })
          ).pipe(
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // send error down the road
              return throwError(err);
            })
          ).subscribe((optionLoadData) => {
            // finished
            this._optionsSubscription = undefined;

            // set options
            optionLoadData.forEach((options, index) => {
              optionsToLoadSelects[index].options = options;
            });

            // hide loading
            this.loading = false;

            // re-render page
            this.detectChanges();
          });
        }
      });
  }
}
