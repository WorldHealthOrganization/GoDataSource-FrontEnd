import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';

@Component({
    selector: 'app-create-reference-data-entry',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-reference-data-entry.component.html',
    styleUrls: ['./create-reference-data-entry.component.less']
})
export class CreateReferenceDataEntryComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
    ];

    categoryId: string;
    // new Entry model
    entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
    }

    ngOnInit() {
        // get the route params
        this.route.params.subscribe((params) => {
            this.categoryId = params.categoryId;

            // retrieve Reference Data Category info
            this.referenceDataDataService
                .getReferenceDataByCategory(params.categoryId)
                .subscribe((category: ReferenceDataCategoryModel) => {
                    // add new breadcrumb: Category page
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(category.name, `/reference-data/${this.categoryId}`)
                    );
                    // add new breadcrumb: page title
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel('LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_TITLE', '.', true)
                    );
                });
        });
    }

    createNewEntry(form: NgForm) {

        // get forms fields
        const dirtyFields: any = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // set category ID for the new entry
        dirtyFields.categoryId = this.categoryId;

        // create new entry
        this.referenceDataDataService
            .createEntry(dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE');

                // navigate to listing page
                this.router.navigate([`/reference-data/${this.categoryId}`]);
            });
    }
}
