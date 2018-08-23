import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Observer } from 'rxjs/Observer';
import { DialogService } from '../helper/dialog.service';
import { DialogAnswer } from '../../../shared/components';

/**
 * Implemented by components that need confirmation before leaving a page
 */
export interface ComponentCanDeactivate {
    canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable()
export class PageChangeConfirmationGuardService implements CanDeactivate<ComponentCanDeactivate> {
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
        component: ComponentCanDeactivate,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
    ): Observable<boolean> | boolean {
        // no guard set here
        // since interfaces can't be used like "component instanceof ComponentCanDeactivate"...
        // we need another way without using classes since we can't extend more than one class which could complicate things
        if (!component.canDeactivate) {
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
        this.dialogService.showConfirm('aaaa').subscribe((dialogAnswer: DialogAnswer) => {
           console.log(dialogAnswer);
        });
    }
}
