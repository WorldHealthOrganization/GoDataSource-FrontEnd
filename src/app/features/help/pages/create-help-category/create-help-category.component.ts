import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-create-help-category',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-help-category.component.html',
    styleUrls: ['./create-help-category.component.less']
})
export class CreateHelpCategoryComponent extends ConfirmOnFormChanges {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/categories'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_HELP_CATEGORY_TITLE', '.', true)
    ];

    helpCategoryData: HelpCategoryModel = new HelpCategoryModel();

    constructor(
        private router: Router,
        private helpDataService: HelpDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService
    ) {
        super();
    }

    /**
     * Create Category
     * @param {NgForm[]} stepForms
     */
    createNewCategory(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new category
            this.helpDataService
                .createHelpCategory(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showApiError(err);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_HELP_CATEGORY_ACTION_CREATE_HELP_CATEGORY_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    // update language tokens to get the translation of name and description
                    this.i18nService.loadUserLanguage().subscribe();
                    // navigate to categories list
                    this.router.navigate(['/help/categories']);
                });
        }
    }

}
