import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { HostListener, Injectable, QueryList, ViewChildren } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Observer } from 'rxjs/Observer';
import { DialogService } from '../helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../shared/components';
import { NgForm } from '@angular/forms';

/**
 * Extended by components that use ngForms to determine the dirtiness of a component & need confirmation before leaving a page
 */
export class ConfirmOnFormChanges {
    /**
     * Children forms
     */
    @ViewChildren(NgForm) protected canDeactivateForms: QueryList<NgForm>;

    /**
     * Check if we have changes on our forms
     */
    @HostListener('window:beforeunload')
    canDeactivate(): boolean | Observable<boolean> {
        // there are no forms to check for changes
        if (
            !this.canDeactivateForms ||
            this.canDeactivateForms.length < 1
        ) {
            return true;
        }

        // check if we have forms with changes
        let foundChanges: boolean = false;
        this.canDeactivateForms.forEach((form: NgForm) => {
            // do we need to ignore this form ?
            // check if form has ignore attribute / directive - NOT needed until now, so it wasn't implemented
            // #TODO

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
    constructor(
       private dialogService: DialogService
    ) {}

    /**
     * Handle can deactivate
     * @param component
     * @param currentRoute
     * @param currentState
     * @param nextState
     */
    canDeactivate(
        component: ConfirmOnFormChanges,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
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
                return Observable.create((observer: Observer<boolean>) => {
                    this.displayConfirmationPopup(observer);
                });
            }
        }

        // observer
        return Observable.create((observer: Observer<boolean>) => {
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
     * @param observer Will be called with true, false accordingly to what options was selected
     */
    private displayConfirmationPopup(observer: Observer<boolean>) {
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_UNSAVED_DATA')
            .subscribe((dialogAnswer: DialogAnswer) => {
                observer.next(dialogAnswer.button === DialogAnswerButton.Yes);
                observer.complete();
            }
        );
    }
}
