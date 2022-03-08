import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { IV2SideDialogConfig, IV2SideDialogConfigButton, IV2SideDialogConfigButtonType, IV2SideDialogData, IV2SideDialogResponse, V2SideDialogConfigInput, V2SideDialogConfigInputType } from './models/side-dialog-config.model';
import { Observable, Subscriber } from 'rxjs';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { AppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';

/**
 * Component
 */
@Component({
  selector: 'app-side-dialog-v2',
  templateUrl: './app-side-dialog-v2.component.html',
  styleUrls: ['./app-side-dialog-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppSideDialogV2Component {
  // Side Nav
  @ViewChild('sideNav', { static: true }) sideNav: MatSidenav;

  // dialog config
  config: IV2SideDialogConfig;
  dialogData: IV2SideDialogData;

  // used to handle responses back to client
  observer$: Subscriber<IV2SideDialogResponse>;

  // filter by value
  filterByValue: string;

  // visible inputs
  visibleInputs: V2SideDialogConfigInput[];

  // filter suffix buttons
  filterSuffixIconButtons: AppFormIconButtonV2[] = [
    new AppFormIconButtonV2({
      icon: 'clear',
      clickAction: () => {
        // clear
        this.filterByValue = undefined;

        // filter
        this.filterInputs();
      }
    })
  ];

  // constants
  V2SideDialogConfigInputType = V2SideDialogConfigInputType;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService
  ) {}

  /**
   * Open sidenav
   */
  show(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    // return response handler
    return new Observable<IV2SideDialogResponse>((observer) => {
      // set listener
      this.observer$ = observer;

      // set data
      this.config = config;

      // map inputs
      this.dialogData = {
        inputs: this.config.inputs,
        map: {}
      };
      this.config.inputs.forEach((input) => {
        this.dialogData.map[input.name] = input;
      });

      // show all
      this.filterByValue = '';
      this.filterInputs();

      // show side nav
      this.sideNav.open();

      // make changes
      this.changeDetectorRef.detectChanges();
    });
  }

  /**
   * Hide sidenav
   */
  hide(triggerResponse?: boolean): void {
    // nothing to do ?
    if (!this.sideNav.opened) {
      return;
    }

    // close side nav
    this.sideNav.close();

    // reset data
    this.config = undefined;
    this.filterByValue = undefined;
    this.visibleInputs = undefined;
    this.dialogData = undefined;

    // trigger response
    if (triggerResponse) {
      this.sendResponse(
        IV2SideDialogConfigButtonType.CANCEL,
        undefined
      );
    }
  }

  /**
   * Send response to client
   */
  private sendResponse(
    type: IV2SideDialogConfigButtonType,
    key: string,
    data?: IV2SideDialogData
  ): void {
    // nothing to do ?
    if (!this.observer$) {
      return;
    }

    // send response
    this.observer$.next({
      // clicked button
      button: {
        type,
        key
      },

      // handler
      handler: {
        // hide dialog
        hide: () => {
          // hide without triggering action since it will be triggered bellow with other options
          this.hide();
        },

        // detect changes
        detectChanges: () => {
          // update UI
          this.changeDetectorRef.detectChanges();
        }
      },

      // response
      data
    });

    // finished
    this.observer$.complete();
    this.observer$ = undefined;
  }

  /**
   * Clicked button
   */
  clickedButton(button: IV2SideDialogConfigButton): void {
    // cancel ?
    if (button.type === IV2SideDialogConfigButtonType.CANCEL) {
      // hide without triggering action since it will be triggered bellow with other options
      this.hide();

      // cancel
      this.sendResponse(
        button.type,
        button.key
      );

      // finished
      return;
    }

    // other button
    // - include response data too
    this.sendResponse(
      button.type,
      button.key,
      this.dialogData
    );
  }

  /**
   * Filter inputs
   */
  filterInputs(): void {
    // nothing to filter ?
    if (
      !this.config?.inputs ||
      this.config.inputs.length < 1
    ) {
      // reset
      this.visibleInputs = undefined;

      // finished
      return;
    }

    // filter - case insensitive
    this.filterByValue = this.filterByValue ?
      this.filterByValue.toLowerCase() :
      this.filterByValue;
    this.visibleInputs = !this.filterByValue ?
      this.config.inputs :
      this.config.inputs.filter((item) =>
        !item.placeholder ||
        this.i18nService.instant(item.placeholder).toLowerCase().indexOf(this.filterByValue) > -1
      );
  }

  /**
   * Listen for keys
   */
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(keysEvent: KeyboardEvent) {
    // no need to do anything ?
    if (this.config?.dontCloseOnBackdrop) {
      return;
    }

    // close on escape
    switch (keysEvent.code) {
      case 'Escape':
        this.hide(true);
        break;
    }
  }
}
