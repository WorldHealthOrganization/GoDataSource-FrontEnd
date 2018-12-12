import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { GlobalEntitySearchDataService } from '../../../core/services/data/global-entity-search.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Subscription } from 'rxjs/Subscription';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { CaseModel } from '../../../core/models/case.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EventModel } from '../../../core/models/event.model';
import { EntityModel } from '../../../core/models/entity.model';
import { EntityType } from '../../../core/models/entity-type';
import { Router } from '@angular/router';

@Component({
    selector: 'app-global-entity-search',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './global-entity-search.component.html',
    styleUrls: ['./global-entity-search.component.less']
})
export class GlobalEntitySearchComponent implements OnInit, OnDestroy {

    globalSearchValue: string;
    selectedOutbreak: OutbreakModel;

    // subscribers
    outbreakSubscriber: Subscription;

    // Side Nav
    @ViewChild('sideNav') sideNav: MatSidenav;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private globalEntitySearchDataService: GlobalEntitySearchDataService,
        private outbreakDataService: OutbreakDataService,
        private router: Router
    ) {
    }

    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
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
     * Close Side Nav
     */
    closeSideNav() {
        this.sideNav.close();
    }

    /**
     * Open Side Nav
     */
    openSideNav() {
        // show side nav
        this.sideNav.open();
    }

    /**
     * Search entity
     */
    search(form: NgForm) {
        // get fields
        const fields: any = this.formHelper.getFields(form);
        if (!_.isEmpty(fields.globalSearchValue)) {
            if (this.selectedOutbreak.id) {
                // search for the entity
                this.globalEntitySearchDataService.searchEntity(this.selectedOutbreak.id, fields.globalSearchValue)
                    .catch((err) => {
                        this.snackbarService.showApiError(err);

                        return ErrorObservable.create(err);
                    })
                    .subscribe((results) => {
                        if (!_.isEmpty(results)) {
                            const foundEntity = results[0];
                            // generate the link for the entity view
                            const personLink = this.getPersonLink(foundEntity);
                            // navigate to the person view page
                            this.router.navigate([personLink]);
                            // empty search field
                            this.globalSearchValue = '';
                            // close side nav
                            this.closeSideNav();
                        } else {
                            this.snackbarService.showError('LNG_GLOBAL_ENTITY_SEARCH_NO_ENTITIES_MESSAGE');
                        }
                    });

            }
        }
    }

    /**
     * Generates view link for entity based on type
     * @param person
     * @returns {string}
     */
    private getPersonLink(person) {
        let entityTypeLink = '';
        if (person instanceof CaseModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.CASE);
        } else if (person instanceof ContactModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.CONTACT);
        } else if (person instanceof EventModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.EVENT);
        }

        return `/${entityTypeLink}/${person.id}/view`;
    }
}
