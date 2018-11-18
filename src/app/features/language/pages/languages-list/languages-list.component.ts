import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../../core/models/language.model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { TopnavComponent } from '../../../../shared/components/topnav/topnav.component';

@Component({
    selector: 'app-languages-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './languages-list.component.html',
    styleUrls: ['./languages-list.component.less']
})
export class LanguagesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing languages
    languagesList$: Observable<LanguageModel[]>;

    @ViewChild('topNav') topNav: TopnavComponent;

    constructor(
        private languageDataService: LanguageDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private cacheService: CacheService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
    }

    /**
     * Table columns
     */
    tableHeaderColumns(): string[] {
        return [
            'name',
            'actions'
        ];
    }

    /**
     * Re(load) the Languages list
     */
    refreshList() {
        // retrieve the list of Languages
        this.languagesList$ = this.languageDataService.getLanguagesList(this.queryBuilder);
    }

    /**
     * Check if we have write access
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Delete language
     * @param {LanguageModel} language
     */
    deleteLanguage(language: LanguageModel) {
        // show confirm dialog
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LANGUAGE', language)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete language
                    this.languageDataService
                        .deleteLanguage(language.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LANGUAGES_ACTION_DELETE_SUCCESS_MESSAGE');

                            // clear cache
                            this.cacheService.remove(CacheKey.LANGUAGES);
                            this.topNav.refreshLanguageList();

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Download Language
     * @param language
     */
    downloadLanguage(language: LanguageModel) {
        // display export dialog
        this.dialogService.showExportDialog({
            message: 'LNG_PAGE_LIST_LANGUAGES_ACTION_EXPORT_TOKENS_DIALOG_TITLE',
            url: `languages/${language.id}/language-tokens/export`,
            fileName: language.name,
            fileType: ExportDataExtension.XLSX
        });
    }
}
