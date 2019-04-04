import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
        private i18nService: I18nService,
        private dialogService: DialogService
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
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.helpDataService
                .createHelpCategory(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    }),
                    switchMap((newCategory) => {
                        // update language tokens to get the translation of name and description
                        return this.i18nService.loadUserLanguage()
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    loadingDialog.close();
                                    return throwError(err);
                                }),
                                map(() => newCategory)
                            );
                    })
                )
                .subscribe((newCategory) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_HELP_CATEGORY_ACTION_CREATE_HELP_CATEGORY_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to new category's modify page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/help/categories/${newCategory.id}/modify`]);
                });
        }
    }

}
