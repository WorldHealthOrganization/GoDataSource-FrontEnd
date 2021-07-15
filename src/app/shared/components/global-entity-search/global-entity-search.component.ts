import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { GlobalEntitySearchDataService } from '../../../core/services/data/global-entity-search.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Subscription } from 'rxjs';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { EntityModel } from '../../../core/models/entity-and-relationship.model';
import { Router } from '@angular/router';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { LoadingDialogModel } from '../loading-dialog/loading-dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RedirectService } from '../../../core/services/helper/redirect.service';

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

    loadingDialog: LoadingDialogModel;

    // Side Nav
    @ViewChild('sideNav', { static: true }) sideNav: MatSidenav;

    /**
     * Constructor
     */
    constructor(
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private globalEntitySearchDataService: GlobalEntitySearchDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private router: Router,
        private redirectService: RedirectService
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
                this.showLoadingDialog();
                // search for the entity
                this.globalEntitySearchDataService.searchEntityCount(this.selectedOutbreak.id, fields.globalSearchValue)
                    .pipe(
                        catchError((err) => {
                            this.closeLoadingDialog();
                            this.snackbarService.showApiError(err);

                            return throwError(err);
                        })
                    )
                    .subscribe((results) => {
                        if (!_.isEmpty(results)) {
                            // if there is a single result, navigate to the entity view page, otherwise display all results in a new page
                            if (results.count === 1) {
                                // search for the entity
                                this.globalEntitySearchDataService.searchEntity(this.selectedOutbreak.id, fields.globalSearchValue)
                                    .pipe(
                                        catchError((err) => {
                                            this.closeLoadingDialog();
                                            this.snackbarService.showApiError(err);

                                            return throwError(err);
                                        })
                                    )
                                    .subscribe((items) => {
                                        if (!_.isEmpty(items)) {
                                            // generate the link for the entity view
                                            const personLink = EntityModel.getPersonLink(items[0]);
                                            // navigate to the person view page
                                            this.router.navigate([personLink]);

                                            // empty search field
                                            this.globalSearchValue = '';
                                            // close side nav
                                            this.closeSideNav();
                                        }

                                        this.closeLoadingDialog();
                                    });
                            } else {
                                // save searched value
                                this.globalEntitySearchDataService.searchValue = this.globalSearchValue;

                                // display all results
                                this.redirectService.to([`/outbreaks/${this.selectedOutbreak.id}/search-results`]);
                            }

                            // empty search field
                            this.globalSearchValue = '';
                            // close side nav
                            this.closeSideNav();
                        } else {
                            this.snackbarService.showError('LNG_GLOBAL_ENTITY_SEARCH_NO_ENTITIES_MESSAGE');

                            // did user enter a UID?
                            if (fields.globalSearchValue.length === 36) {
                                // ask user about creating a new case with the given UID
                                this.askCreateCaseWithUID(fields.globalSearchValue);
                            }
                        }
                        this.closeLoadingDialog();
                    });

            }
        }
    }

    /**
     * Ask user about creating a new case with a given UID
     */
    askCreateCaseWithUID(uid: string) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_GLOBAL_ENTITY_SEARCH_DIALOG_CREATE_CASE_WITH_UID_TITLE')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.router.navigate([`/cases/create`], { queryParams: { uid: uid } });

                    // close side nav
                    this.closeSideNav();
                }
            });
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }


}
