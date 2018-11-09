import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { LanguageModel } from '../../../../core/models/language.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';

@Component({
    selector: 'app-create-language',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-language.component.html',
    styleUrls: ['./create-language.component.less']
})
export class CreateLanguageComponent extends ConfirmOnFormChanges {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_LANGUAGE_TITLE', '.', true)
    ];

    languageData: LanguageModel = new LanguageModel();

    constructor(
        private router: Router,
        private languageDataService: LanguageDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private cacheService: CacheService
    ) {
        super();
    }

    /**
     * Create Language
     * @param {NgForm[]} stepForms
     */
    createNewLanguage(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Event
            this.languageDataService
                .createLanguage(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_LANGUAGE_ACTION_CREATE_LANGUAGE_SUCCESS_MESSAGE');

                    // clear cache
                    this.cacheService.remove(CacheKey.LANGUAGES);

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate(['/languages']);
                });
        }
    }
}
