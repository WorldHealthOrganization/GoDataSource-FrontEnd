import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageDataService } from '../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../core/models/language.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-topnav-unauthenticated',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav-unauthenticated.component.html',
    styleUrls: ['./topnav-unauthenticated.component.less']
})
export class TopnavUnauthenticatedComponent implements OnInit {
    // selected Language ID
    selectedLanguageId: string;

    // list of languages
    languagesList$: Observable<LanguageModel[]>;

    /**
     * Constructor
     */
    constructor(
        private languageDataService: LanguageDataService,
        private i18nService: I18nService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // refresh language list
        this.refreshLanguageList();
    }

    /**
     * Refresh language list
     */
    refreshLanguageList() {
        // get the list of languages
        this.languagesList$ = this.languageDataService
            .getLanguagesList()
            .pipe(map((languages) => {
                return (languages || []).sort((item1: LanguageModel, item2: LanguageModel) => {
                    return item1.name.toLowerCase().localeCompare(item2.name.toLowerCase());
                });
            }));

        // get the selected language ID
        this.selectedLanguageId = this.i18nService.getSelectedLanguageId();
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
