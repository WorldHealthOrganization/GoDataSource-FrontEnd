import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HelpItemModel } from '../../../../core/models/help-item.model';

@Component({
    selector: 'app-modify-help-category',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-help-category.component.html',
    styleUrls: ['./modify-help-category.component.less']
})
export class ModifyHelpCategoryComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    HelpCategoryModel = HelpCategoryModel;
    HelpItemModel = HelpItemModel;

    helpCategoryData: HelpCategoryModel = new HelpCategoryModel();
    categoryId: string;

    // authenticated user
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private helpDataService: HelpDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // show loading
        this.showLoadingDialog(false);

        this.route.params
            .subscribe((params: { categoryId }) => {
                this.categoryId = params.categoryId;
                // get category
                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((helpCategoryData) => {
                        this.helpCategoryData = helpCategoryData;

                        // update breadcrumbs
                        this.initializeBreadcrumbs();

                        // hide loading
                        this.hideLoadingDialog();
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (HelpCategoryModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/categories')
            );
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_HELP_CATEGORY_TITLE' : 'LNG_PAGE_MODIFY_HELP_CATEGORY_TITLE',
                '.',
                true,
                {},
                this.helpCategoryData
            )
        );
    }

    /**
     * Modify Help category
     */
    modifyHelpCategory(form: NgForm) {
        const dirtyFields: any = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // modify the category
        this.helpDataService
            .modifyHelpCategory(this.categoryId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                }),
                switchMap((helpCategoryData) => {
                    // update language tokens to get the translation of name and description
                    return this.i18nService.loadUserLanguage()
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                // hide loading
                                this.hideLoadingDialog();
                                return throwError(err);
                            }),
                            map(() => helpCategoryData)
                        );
                })
            )
            .subscribe((helpCategoryData) => {
                // update model
                this.helpCategoryData = helpCategoryData;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_HELP_CATEGORY_ACTION_MODIFY_HELP_CATEGORY_SUCCESS_MESSAGE');

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
