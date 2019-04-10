import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { LanguageModel } from '../../../../core/models/language.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-modify-language',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-language.component.html',
    styleUrls: ['./modify-language.component.less']
})
export class ModifyLanguageComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    languageId: string;
    languageData: LanguageModel = new LanguageModel();

    // authenticated user
    authUser: UserModel;

    constructor(
        protected route: ActivatedRoute,
        private languageDataService: LanguageDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private cacheService: CacheService,
        private authDataService: AuthDataService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params
            .subscribe((params: {languageId}) => {
                // get language
                this.languageId = params.languageId;
                this.languageDataService
                    .getLanguage(this.languageId)
                    .subscribe((languageData: LanguageModel) => {
                        // since this is cached we need to clone it because otherwise we modify the existing object and if we chose to discard changes...
                        this.languageData = new LanguageModel(languageData);
                        this.createBreadcrumbs();
                    });
            });
    }

    /**
     * Check if we have write access
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    modifyLanguage(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the event
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.languageDataService
            .modifyLanguage(this.languageId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return throwError(err);
                }),
                switchMap((modifiedLanguage) => {
                    // remove help items from cache
                    this.cacheService.remove(CacheKey.LANGUAGES);

                    // update language tokens
                    return this.languageDataService.getLanguagesList()
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                loadingDialog.close();
                                return throwError(err);
                            }),
                            map(() => modifiedLanguage)
                        );
                })
            )
            .subscribe((modifiedLanguage: LanguageModel) => {
                // update model
                this.languageData = modifiedLanguage;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LANGUAGE_ACTION_MODIFY_LANGUAGE_SUCCESS_MESSAGE');

                // update breadcrumb
                this.createBreadcrumbs();

                // hide dialog
                loadingDialog.close();
        });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [
            new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_LANGUAGE_TITLE' : 'LNG_PAGE_MODIFY_LANGUAGE_TITLE',
                '.',
                true,
                {},
                this.languageData
            )
        ];
    }
}
