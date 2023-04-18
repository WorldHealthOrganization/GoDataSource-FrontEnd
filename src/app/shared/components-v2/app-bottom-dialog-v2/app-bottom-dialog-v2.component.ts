import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { IV2BottomDialogConfig, IV2BottomDialogConfigButton, IV2BottomDialogConfigButtonType, IV2BottomDialogHandler, IV2BottomDialogResponse } from './models/bottom-dialog-config.model';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SubscriptionLike } from 'rxjs/internal/types';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';

/**
 * Component
 */
@Component({
  selector: 'app-bottom-dialog-v2',
  templateUrl: './app-bottom-dialog-v2.component.html',
  styleUrls: ['./app-bottom-dialog-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppBottomDialogV2Component implements OnInit, OnDestroy {
  // already dismissed ?
  private dismissed: boolean = false;

  // dialog config
  dialogHandler: IV2BottomDialogHandler = {
    // hide dialog
    hide: () => {
      // hide
      this.hide();
    },

    // detect changes
    detectChanges: () => {
      // update UI
      this.changeDetectorRef.detectChanges();
    },

    // loading
    loading: {
      // show loading
      show: (
        message?: string,
        messageData?: {
          [key: string]: string
        }
      ) => {
        // already showing ?
        if (this.loading) {
          return;
        }

        // show and update message
        this.loading = {
          message,
          messageData
        };

        // update ui
        this.changeDetectorRef.detectChanges();
      },

      // hide loading
      hide: () => {
        // already not visible ?
        if (!this.loading) {
          return;
        }

        // hide
        this.loading = undefined;

        // update ui
        this.changeDetectorRef.detectChanges();
      },

      // change loading message
      message: (
        message: string,
        messageData?: {
          [key: string]: string
        }
      ) => {
        // not visible, then don't update message
        if (!this.loading) {
          return;
        }

        // update message
        this.loading.message = message;
        this.loading.messageData = messageData;

        // update ui
        this.changeDetectorRef.detectChanges();
      }
    }
  };

  // loading setup
  loading: {
    // optional
    message?: string,
    messageData?: {
      [key: string]: string
    }
  } | undefined;

  // subscriptions
  locationSubscription: SubscriptionLike;
  backdropClick: Subscription;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService,
    location: Location,
    @Inject(MAT_BOTTOM_SHEET_DATA) public config: IV2BottomDialogConfig,
    protected matBottomSheetRef: MatBottomSheetRef<AppBottomDialogV2Component, IV2BottomDialogResponse>
  ) {
    // location change
    this.locationSubscription = location.subscribe(() => {
      this.hide();
    });

    // backdrop click
    this.backdropClick = matBottomSheetRef
      .backdropClick()
      .subscribe(() => {
        // hide if not disabled ?
        if (
          !this.loading &&
          !config?.dontCloseOnBackdrop
        ) {
          this.hide();
        }
      });
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // initialized
    if (this.config.initialized) {
      this.config.initialized(this.dialogHandler);
    }
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release location subscription
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = undefined;
    }

    // release backdrop subscription
    if (this.backdropClick) {
      this.backdropClick.unsubscribe();
      this.backdropClick = undefined;
    }
  }

  /**
   * Hide dialog
   */
  hide(
    type: IV2BottomDialogConfigButtonType = IV2BottomDialogConfigButtonType.CANCEL,
    key?: string
  ): void {
    // already dismissed ?
    if (this.dismissed) {
      return;
    }

    // close dialog
    this.dismissed = true;
    this.matBottomSheetRef.dismiss({
      button: {
        type: type,
        key: key
      }
    });

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Clicked button
   */
  clickedButton(button: IV2BottomDialogConfigButton): void {
    // hide
    this.hide(
      button.type,
      button.key
    );
  }

  /**
   * Listen for keys
   */
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(keysEvent: KeyboardEvent) {
    // no need to do anything ?
    if (
      this.config?.dontCloseOnBackdrop ||
      this.loading
    ) {
      return;
    }

    // close on escape
    switch (keysEvent.code) {
      case 'Escape':
        this.hide();
        break;
    }
  }
}
