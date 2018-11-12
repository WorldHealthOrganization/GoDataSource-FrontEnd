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

@Component({
    selector: 'app-modify-help-category',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-help-category.component.html',
    styleUrls: ['./modify-help-category.component.less']
})
export class ModifyHelpCategoryComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/help-categories')
    ];

    helpCategoryData: HelpCategoryModel = new HelpCategoryModel();
    categoryId: string;

    // authenticated user
    authUser: UserModel;

    constructor(
        protected route: ActivatedRoute,
        private helpDataService: HelpDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private authDataService: AuthDataService,
        private i18nService: I18nService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params
            .subscribe((params: {categoryId}) => {
                this.categoryId = params.categoryId;
                // get category
                this.helpDataService
                    .getHelpCategory( this.categoryId)
                    .subscribe(helpCategoryData => {
                        this.helpCategoryData = new HelpCategoryModel(helpCategoryData);
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.viewOnly ? 'LNG_PAGE_VIEW_HELP_CATEGORY_TITLE' : 'LNG_PAGE_MODIFY_HELP_CATEGORY_TITLE',
                                '.',
                                true,
                                {},
                                {}
                            )
                        );
                    });
            });
    }

    modifyHelpCategory(form: NgForm) {
        const dirtyFields: any = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the event
        this.helpDataService
            .modifyHelpCategory(this.categoryId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_HELP_CATEGORY_ACTION_MODIFY_HELP_CATEGORY_SUCCESS_MESSAGE');

                // navigate to listing page
                this.disableDirtyConfirm();
                // update language tokens to get the translation of name and description
                this.i18nService.loadUserLanguage().subscribe();
                // navigate to the list of categories
                this.router.navigate(['/help/help-categories']);
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
