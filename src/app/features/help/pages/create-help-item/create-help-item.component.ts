import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import * as _ from 'lodash';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { UserModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';

@Component({
    selector: 'app-create-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-help-item.component.html',
    styleUrls: ['./create-help-item.component.less']
})
export class CreateHelpItemComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    helpItemData: HelpItemModel = new HelpItemModel();
    categoryId: string;
    selectedCategory: HelpCategoryModel;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private helpDataService: HelpDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService,
        private route: ActivatedRoute,
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

        this.route.params
            .subscribe((params: { categoryId }) => {
                this.categoryId = params.categoryId;
                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((category) => {
                        // set category data
                        this.selectedCategory = category;

                        // initialize breadcrumbs
                        this.initializeBreadcrumbs();
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (HelpCategoryModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/categories'));
        }

        // add list breadcrumb only if we have permission
        if (
            HelpCategoryModel.canView(this.authUser) &&
            this.selectedCategory
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.selectedCategory.name,
                    `/help/categories/${this.categoryId}/view`,
                    false,
                    {},
                    this.selectedCategory
                )
            );
        }

        // list children
        if (HelpItemModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
                    `/help/categories/${this.categoryId}/items`,
                    false,
                    {},
                    {}
                )
            );
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_HELP_ITEM_TITLE', '.', true));
    }

    /**
     * Create Category Item
     * @param {NgForm[]} stepForms
     */
    createHelpCategoryItem(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new category
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.helpDataService
                .createHelpItem(this.categoryId, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    }),
                    switchMap((newHelpItem) => {
                        // update language tokens to get the translation of name and description
                        return this.i18nService.loadUserLanguage()
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    loadingDialog.close();
                                    return throwError(err);
                                }),
                                map(() => newHelpItem)
                            );
                    })
                )
                .subscribe((newHelpItem) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_HELP_ITEM_ACTION_CREATE_HELP_ITEM_SUCCESS_MESSAGE');

                    // remove help items from cache
                    // this isn't really necessary since we retrieve & cache only approve items, and since default approve value is false..this won't be retrieved
                    // but, we can keep it to prevent future changes that might introduce bugs
                    this.cacheService.remove(CacheKey.HELP_ITEMS);

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    // method handles disableDirtyConfirm too...
                    this.redirectToProperPageAfterCreate(
                        this.router,
                        this.redirectService,
                        this.authUser,
                        HelpItemModel,
                        `help/categories/${this.categoryId}/items`,
                        newHelpItem.id
                    );
                });
        }
    }

}
