import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { IV2SideDialogConfig, IV2SideDialogConfigButton, IV2SideDialogConfigButtonType, IV2SideDialogResponse, V2SideDialogConfigInput, V2SideDialogConfigInputType } from './models/side-dialog-config.model';
import { Observable, Subscriber } from 'rxjs';

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

  // used to handle responses back to client
  observer$: Subscriber<IV2SideDialogResponse>;

  // constants
  V2SideDialogConfigInputType = V2SideDialogConfigInputType;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
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
    // close side nav
    this.sideNav.close();

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
    data?: V2SideDialogConfigInput[]
  ): void {
    // send response
    this.observer$.next({
      // clicked button
      button: {
        type,
        key
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

    // hide without triggering action since it will be triggered bellow with other options
    this.hide();

    // other button
    // - include response data too
    this.sendResponse(
      button.type,
      button.key,
      this.config?.inputs
    );
  }
}
