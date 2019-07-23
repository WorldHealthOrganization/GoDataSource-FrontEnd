import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Directive({
    selector: '[app-selected-outbreak-is-active]'
})
export class SelectedOutbreakIsActiveDirective implements OnInit, OnDestroy {
    private _selectedOutbreak: OutbreakModel;

    outbreakSubscriber: Subscription;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private viewContainer: ViewContainerRef,
        private templateRef: TemplateRef<any>
    ) {}

    ngOnInit() {
        // initial hide show
        this.hideShow();

        // check if selected outbreak is the active one
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // oub5reak changed, we need to check elements again
                this._selectedOutbreak = selectedOutbreak;
                this.hideShow();
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Hide show element
     */
    private hideShow() {
        // display item only if selected outbreak is the active one
        if (this._selectedOutbreak) {
            const authUser = this.authDataService.getAuthenticatedUser();
            if (authUser.activeOutbreakId === this._selectedOutbreak.id) {
                // create element only if we didn't do this already
                if (this.viewContainer.length < 1) {
                    this.viewContainer.createEmbeddedView(this.templateRef);
                }
            } else {
                this.viewContainer.clear();
            }
        } else {
            this.viewContainer.clear();
        }
    }
}
