import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import * as _ from 'lodash';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import 'rxjs/add/operator/switchMap';

@Component({
    selector: 'app-create-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-help-item.component.html',
    styleUrls: ['./create-help-item.component.less']
})
export class CreateHelpItemComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', `/help/categories/`)
    ];

    helpItemData: HelpItemModel = new HelpItemModel();
    categoryId: string;
    selectedCategory: HelpCategoryModel;

    constructor(
        private router: Router,
        private helpDataService: HelpDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService,
        private route: ActivatedRoute,
        private cacheService: CacheService
    ) {
        super();
    }

    ngOnInit() {
        this.route.params
            .subscribe((params: { categoryId }) => {
                this.categoryId = params.categoryId;
                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((category) => {
                        this.selectedCategory = category;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.selectedCategory.name,
                                `/help/categories/${this.categoryId}/view`,
                                false,
                                {},
                                {}
                            )
                        );
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
                                `/help/categories/${this.categoryId}/items`,
                                false,
                                {},
                                {}
                            )
                        );
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                'LNG_PAGE_CREATE_HELP_ITEM_TITLE',
                                '.',
                                true,
                                {},
                                {}
                            )
                        );
                    });
            });
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
                .createHelpItem(this.categoryId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showApiError(err);
                    return ErrorObservable.create(err);
                })
                .switchMap((newHelpItem) => {
                    // update language tokens to get the translation of name and description
                    return this.i18nService.loadUserLanguage()
                        .map(() => newHelpItem);
                })
                .subscribe((newHelpItem) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_HELP_ITEM_ACTION_CREATE_HELP_ITEM_SUCCESS_MESSAGE');

                    // remove help items from cache
                    this.cacheService.remove(CacheKey.HELP_ITEMS);

                    // navigate to new item's modify page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/help/categories/${this.categoryId}/items/${newHelpItem.id}/modify`]);
                });
        }
    }

}
