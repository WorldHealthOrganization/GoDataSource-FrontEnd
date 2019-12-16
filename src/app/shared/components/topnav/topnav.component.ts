import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Observable, Subscription } from 'rxjs';
import { UserModel } from '../../../core/models/user.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { LanguageDataService } from '../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../core/models/language.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { catchError, map } from 'rxjs/operators';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent implements OnInit, OnDestroy {
    @Input() activeOutbreakEditable: boolean = true;

    // constants
    OutbreakModel = OutbreakModel;

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();
    // selected Language ID
    selectedLanguageId: string;

    // list of outbreaks for Selected Outbreak dropdown
    outbreaksList: OutbreakModel[] = [];

    // list of languages
    languagesList$: Observable<LanguageModel[]>;

    getSelectedOutbreakSubject: Subscription;

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private languageDataService: LanguageDataService,
        private i18nService: I18nService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        // get the outbreaks list
        this.refreshOutbreaksList();

        // refresh language list
        this.refreshLanguageList();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // subscribe to the selected outbreak stream
        this.getSelectedOutbreakSubject = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((outbreak: OutbreakModel) => {
                if (outbreak) {
                    // refresh the outbreaks list
                    this.refreshOutbreaksList();

                    // update the selected outbreak
                    this.selectedOutbreak = outbreak;
                }
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        if (this.getSelectedOutbreakSubject) {
            this.getSelectedOutbreakSubject.unsubscribe();
            this.getSelectedOutbreakSubject = null;
        }
    }

    /**
     * Refresh language list
     */
    refreshLanguageList() {
        // get the list of languages
        this.languagesList$ = this.languageDataService.getLanguagesList();

        // get the selected language ID
        this.selectedLanguageId = this.i18nService.getSelectedLanguageId();
    }

    /**
     * Refresh outbreak list
     */
    refreshOutbreaksList() {
        // get the authenticated user
        // we need to reload data - since component isn't re-rendered
        this.authUser = this.authDataService.getAuthenticatedUser();

        // we don't have access to outbreaks ?
        if (!OutbreakModel.canView(this.authUser)) {
            return;
        }

        // outbreak data
        this.outbreakDataService
            .getOutbreaksListReduced()
            .pipe(
                map((outbreaksList) => {
                    return _.map(outbreaksList, (outbreak: OutbreakModel) => {
                        // add outbreak details
                        outbreak.details = outbreak.name + (_.isEmpty(outbreak.description) ? '' : `: ${outbreak.description}`);

                        // do we need to update name of the outbreak ?
                        if (outbreak.id === this.authUser.activeOutbreakId) {
                            outbreak.name = this.i18nService.instant('LNG_LAYOUT_ACTIVE_OUTBREAK_LABEL', outbreak);
                        }

                        // finished
                        return outbreak;
                    });
                })
            )
            .subscribe((outbreaksList) => {
                this.outbreaksList = outbreaksList;
            });
    }

    /**
     * Change the selected Outbreak across the application
     * @param {OutbreakModel} outbreak
     */
    selectOutbreak(outbreak: OutbreakModel) {
        if (
            !outbreak ||
            !outbreak.id
        ) {
            // set selected outbreak
            this.selectedOutbreak = outbreak;

            // cache the selected Outbreak
            this.outbreakDataService.setSelectedOutbreak(this.selectedOutbreak);
        } else {
            // retrieve outbreak data since we have only truncated data here
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.outbreakDataService
                .getOutbreak(outbreak.id)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((outbreakData) => {
                    // set selected outbreak
                    this.selectedOutbreak = outbreakData;

                    // hide loading dialog
                    loadingDialog.close();

                    // cache the selected Outbreak
                    this.outbreakDataService.setSelectedOutbreak(this.selectedOutbreak);
                });
        }
    }

    /**
     * Change the selected Language across the application
     * @param {LanguageModel} language
     */
    selectLanguage(language: LanguageModel) {
        // display loading
        const loadingDialog = this.dialogService.showLoadingDialog();

        this.i18nService
            .changeLanguage(language)
            .subscribe(() => {
                // hide loading
                loadingDialog.close();

                // finished
                this.snackbarService.showSuccess('LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE');
            });
    }
}
