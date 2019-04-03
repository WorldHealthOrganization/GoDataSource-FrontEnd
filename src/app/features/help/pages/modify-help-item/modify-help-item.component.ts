import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { Observable } from 'rxjs';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';

import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-help-item.component.html',
    styleUrls: ['./modify-help-item.component.less']
})
export class ModifyHelpItemComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    helpItemData: HelpItemModel = new HelpItemModel();
    categoryId: string;
    itemId: string;
    selectedCategory: HelpCategoryModel;

    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // authenticated user
    authUser: UserModel;

    constructor(
        protected route: ActivatedRoute,
        private helpDataService: HelpDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        private cacheService: CacheService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();

        this.route.params
            .subscribe((params: { categoryId, itemId }) => {
                this.categoryId = params.categoryId;
                this.itemId = params.itemId;

                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((category) => {
                        this.selectedCategory = category;
                        this.createBreadcrumbs();

                        // get item
                        this.helpDataService
                            .getHelpItem(this.categoryId, this.itemId)
                            .subscribe((helpItemData) => {
                                // since this is cached we need to clone it because otherwise we modify the existing object and if we chose to discard changes...
                                // for help items this isn't really necessary, because get id isn't cached as it is for languages but still it is a good idea to clone it
                                this.helpItemData = new HelpItemModel(helpItemData);

                                // ngx-wig isn't pristine at start when setting ng-model
                                // so we need to hack it
                                // wait for binding
                                setTimeout(() => {
                                    this.canDeactivateForms.forEach((form: NgForm) => {
                                        if (form.controls['content']) {
                                            form.controls['content'].markAsPristine();
                                        }
                                    });
                                });
                            });
                    });
            });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_HELP_CATEGORIES_TITLE',
                '/help/categories'
            ),

            new BreadcrumbItemModel(
                this.selectedCategory.name,
                `/help/categories/${this.categoryId}/view`,
                false,
                {},
                {}
            ),

            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
                `/help/categories/${this.categoryId}/items`,
                false,
                {},
                {}
            ),

            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_HELP_ITEM_TITLE' : 'LNG_PAGE_MODIFY_HELP_ITEM_TITLE',
                '.',
                true,
                {},
                {}
            )
        ];
    }

    modifyHelpCategoryItem(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // since we change content, should we reset approve value to false?
        // #TODO - #TBD

        // modify the help item
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.helpDataService
            .modifyHelpItem(this.categoryId, this.itemId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showApiError(err);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .switchMap((helpItemData) => {
                // update language tokens to get the translation of name and description
                return this.i18nService.loadUserLanguage()
                    .catch((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return ErrorObservable.create(err);
                    })
                    .map(() => helpItemData);
            })
            .subscribe((helpItemData) => {
                // update model
                this.helpItemData = helpItemData;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_HELP_ITEM_ACTION_MODIFY_HELP_ITEM_SUCCESS_MESSAGE');

                // remove help items from cache
                this.cacheService.remove(CacheKey.HELP_ITEMS);

                // update breadcrumb
                this.createBreadcrumbs();

                // hide dialog
                loadingDialog.close();
            });
    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_HELP);
    }
}
