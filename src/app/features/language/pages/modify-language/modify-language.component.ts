import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { LanguageModel } from '../../../../core/models/language.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

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
        private authDataService: AuthDataService
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
                        this.languageData = languageData;
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
        this.languageDataService
            .modifyLanguage(this.languageId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedLanguage: LanguageModel) => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LANGUAGE_ACTION_MODIFY_LANGUAGE_SUCCESS_MESSAGE');

                // clear cache
                this.cacheService.remove(CacheKey.LANGUAGES);

                this.languageData = new LanguageModel(modifiedLanguage);
                // navigate to listing page
                this.disableDirtyConfirm();
                this.createBreadcrumbs();
        });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_LANGUAGE_TITLE' : 'LNG_PAGE_MODIFY_LANGUAGE_TITLE',
                '.',
                true,
                {},
                this.languageData
            )
        );
    }
}
