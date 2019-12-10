import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../../core/models/language.model';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { TopnavComponent } from '../../../../shared/components/topnav/topnav.component';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import * as _ from 'lodash';

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

    // constants
    LanguageModel = LanguageModel;

    // authenticated user
    authUser: UserModel;

    // list of existing languages
    languagesList$: Observable<LanguageModel[]>;
    languagesListCount$: Observable<any>;

    @ViewChild('topNav') topNav: TopnavComponent;

    loadingDialog: LoadingDialogModel;

    recordActions: HoverRowAction[] = [
        // View Language
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_LANGUAGES_ACTION_VIEW_LANGUAGE',
            click: (item: LanguageModel) => {
                this.router.navigate(['/languages', item.id, 'view']);
            },
            visible: (item: LanguageModel): boolean => {
                return LanguageModel.canView(this.authUser);
            }
        }),

        // Modify Language
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_LANGUAGES_ACTION_MODIFY_LANGUAGE',
            click: (item: LanguageModel) => {
                this.router.navigate(['/languages', item.id, 'modify']);
            },
            visible: (item: LanguageModel): boolean => {
                return !item.readOnly &&
                    LanguageModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Language
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_DELETE_LANGUAGE',
                    click: (item: LanguageModel) => {
                        this.deleteLanguage(item);
                    },
                    visible: (item: LanguageModel): boolean => {
                        return !item.readOnly &&
                            LanguageModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: LanguageModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.readOnly &&
                            LanguageModel.canDelete(this.authUser);
                    }
                }),

                // Export Language Tokens
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_EXPORT_TOKENS',
                    click: (item: LanguageModel) => {
                        this.downloadLanguage(item);
                    },
                    visible: (item: LanguageModel): boolean => {
                        return LanguageModel.canExportTokens(this.authUser);
                    }
                }),

                // import Language Tokens
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_IMPORT_TOKENS',
                    click: (item: LanguageModel) => {
                        this.router.navigate(['/import-export-data', 'language-data', item.id, 'import-tokens']);
                    },
                    visible: (): boolean => {
                        return LanguageModel.canImportTokens(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        private router: Router,
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

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize pagination
        this.initPaginator();

        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
    }

    /**
     * Table columns
     */
    tableHeaderColumns(): string[] {
        return [
            'name'
        ];
    }

    /**
     * Re(load) the Languages list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // retrieve the list of Languages
        this.languagesList$ = this.languageDataService
            .getLanguagesList(this.queryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap(this.checkEmptyList.bind(this)),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.languagesListCount$ = this.languageDataService
            .getLanguagesCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
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
            fileType: ExportDataExtension.XLSX,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
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
