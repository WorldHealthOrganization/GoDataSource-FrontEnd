import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { LanguageModel } from '../../../../core/models/language.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-language',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-language.component.html',
    styleUrls: ['./create-language.component.less']
})
export class CreateLanguageComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    languageData: LanguageModel = new LanguageModel();

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private languageDataService: LanguageDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private cacheService: CacheService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (LanguageModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_LANGUAGE_TITLE', '.', true));
    }

    /**
     * Create Language
     */
    createNewLanguage(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Language
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.languageDataService
                .createLanguage(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newLanguage: LanguageModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_LANGUAGE_ACTION_CREATE_LANGUAGE_SUCCESS_MESSAGE');

                    // clear cache
                    this.cacheService.remove(CacheKey.LANGUAGES);

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    // method handles disableDirtyConfirm too...
                    this.redirectToProperPageAfterCreate(
                        this.router,
                        this.redirectService,
                        this.authUser,
                        LanguageModel,
                        'languages',
                        newLanguage.id
                    );
                });
        }
    }
}
