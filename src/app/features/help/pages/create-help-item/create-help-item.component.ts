import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Component({
    selector: 'app-create-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-help-item.component.html',
    styleUrls: ['./create-help-item.component.less']
})
export class CreateHelpItemComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_ITEMS_TITLE', '/help'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_HELP_ITEM_TITLE', '.', true)
    ];

    helpItemData: HelpItemModel = new HelpItemModel();
    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    constructor(
        private router: Router,
        private helpDataService: HelpDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService
    ) {
        super();
    }

    ngOnInit() {
        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();
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
                .createHelpItem(this.helpItemData.categoryId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_HELP_ITEM_ACTION_CREATE_HELP_ITEM_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    // update language tokens to get the translation of name and description
                    this.i18nService.loadUserLanguage().subscribe();
                    // navigate to categories list
                    this.router.navigate(['/help']);
                });
        }
    }

}
