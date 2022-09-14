import { CanDeactivate } from '@angular/router';
import { Directive, HostListener, Injectable, ViewChild } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import * as _ from 'lodash';
import { NgForm } from '@angular/forms';
import { AppCreateViewModifyV2Component } from '../../../shared/components-v2/app-create-view-modify-v2/app-create-view-modify-v2.component';
import { DialogV2Service } from '../helper/dialog-v2.service';
import { AppBottomDialogV2Component } from '../../../shared/components-v2/app-bottom-dialog-v2/app-bottom-dialog-v2.component';
import { IV2BottomDialogConfigButtonType, IV2BottomDialogResponse } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

/**
 * Extended by components that use ngForms to determine the dirtiness of a component & need confirmation before leaving a page
 */
@Directive()
export class ConfirmOnFormChanges {
  // disable all dirty dialogs
  private static _allConfirmDisabled: boolean = false;

  // Child forms
  @ViewChild(AppCreateViewModifyV2Component, { static: true }) protected createViewModifyComponent: AppCreateViewModifyV2Component;

  // False if confirm dialog should be shown when forms are dirty
  private _confirmDisabled: boolean = false;

  /**
     * Disable all dirty confirm dialogs
     */
  static disableAllDirtyConfirm() {
    this._allConfirmDisabled = true;
  }

  /**
     * Enable all dirty confirm dialogs
     */
  static enableAllDirtyConfirm() {
    this._allConfirmDisabled = false;
  }

  /**
     * Don't display confirm popup ( even if forms are dirty )
     */
  disableDirtyConfirm() {
    this._confirmDisabled = true;
  }

  /**
   * Display confirm popup if forms are dirty
   */
  enableDirtyConfirm() {
    this._confirmDisabled = false;
  }

  /**
   * Check if we have changes on our forms
   */
  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    // nothing to check ?
    if (
      ConfirmOnFormChanges._allConfirmDisabled ||
      this._confirmDisabled ||
      !this.createViewModifyComponent ||
      this.createViewModifyComponent.isView
    ) {
      return true;
    }

    // determine forms
    const canDeactivateForms: NgForm[] = [];
    (this.createViewModifyComponent.tabData?.tabs || [])
      .forEach((tab) => {
        // nothing to do
        if (!tab.form) {
          return;
        }

        // add form
        canDeactivateForms.push(tab.form);
      });

    // there are no forms to check for changes ?
    if (canDeactivateForms.length < 1) {
      return true;
    }

    // check if we have forms with changes
    let foundChanges: boolean = false;
    canDeactivateForms.forEach((form: NgForm) => {
      // determine if we have changes
      if (form.dirty) {
        // we found changes, there is no point in going through the rest of the forms
        foundChanges = true;
        return false;
      }
    });

    // do we have changes, if not user can leave page without confirmation ?
    return !foundChanges;
  }
}

@Injectable()
export class PageChangeConfirmationGuard implements CanDeactivate<ConfirmOnFormChanges> {
  // keep reference ti dialog so we don't show multiple dialogs
  private static _dirtyDialog: MatBottomSheetRef<AppBottomDialogV2Component>;

  /**
   * Close all visible dirty dialogs
   */
  static closeVisibleDirtyDialog() {
    if (PageChangeConfirmationGuard._dirtyDialog) {
      PageChangeConfirmationGuard._dirtyDialog.instance.hide(
        IV2BottomDialogConfigButtonType.OTHER,
        'yes'
      );
      PageChangeConfirmationGuard._dirtyDialog = undefined;
    }
  }

  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service
  ) {}

  /**
   * Handle can deactivate
   */
  canDeactivate(
    component: ConfirmOnFormChanges
  ): Observable<boolean> | boolean {
    // no guard set here
    if (!(component instanceof ConfirmOnFormChanges)) {
      return true;
    }

    // check if we have an observer or a boolean value
    const canDeactivate: boolean | Observable<boolean> = component.canDeactivate();
    if (_.isBoolean(canDeactivate)) {
      if (canDeactivate) {
        return true;
      } else {
        // display confirmation popup
        return new Observable((observer: Observer<boolean>) => {
          this.displayConfirmationPopup(observer);
        });
      }
    }

    // observer
    return new Observable((observer: Observer<boolean>) => {
      (canDeactivate as Observable<boolean>).subscribe((obsCanDeactivate: boolean) => {
        if (obsCanDeactivate) {
          observer.next(true);
          observer.complete();
        } else {
          // display confirmation popup
          this.displayConfirmationPopup(observer);
        }
      });
    });
  }

  /**
   * Display popup
   */
  private displayConfirmationPopup(observer: Observer<boolean>) {
    // we shouldn't show multiple dialogs
    if (PageChangeConfirmationGuard._dirtyDialog) {
      return;
    }

    // create dialog
    PageChangeConfirmationGuard._dirtyDialog = this.dialogV2Service
      .showBottomDialogBare({
        config: {
          title: {
            get: () => 'LNG_DIALOG_CONFIRM_UNSAVED_DATA_TITLE'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_UNSAVED_DATA'
          }
        },
        bottomButtons: [{
          type: IV2BottomDialogConfigButtonType.OTHER,
          label: 'LNG_DIALOG_CONFIRM_BUTTON_YES',
          key: 'yes',
          color: 'warn'
        }, {
          type: IV2BottomDialogConfigButtonType.CANCEL,
          label: 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL',
          color: 'text'
        }]
      });

    // display dialog
    PageChangeConfirmationGuard._dirtyDialog
      .afterDismissed()
      .subscribe((response: IV2BottomDialogResponse) => {
        // dialog closed
        PageChangeConfirmationGuard._dirtyDialog = undefined;

        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // send response
        observer.next(response.button.type === IV2BottomDialogConfigButtonType.OTHER);
        observer.complete();
      });
  }
}
