import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-modify-reference-data-entry',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-reference-data-entry.component.html',
    styleUrls: ['./modify-reference-data-entry.component.less']
})
export class ModifyReferenceDataEntryComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
    ];

    categoryId: string;
    entryId: string;
    // new Entry model
    entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();

    authUser: UserModel;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        // get the route params
        this.route.params
            .subscribe((params: {categoryId, entryId}) => {
                this.categoryId = params.categoryId;
                this.entryId = params.entryId;

                // retrieve Reference Data Entry info
                this.referenceDataDataService
                    .getEntry(params.entryId)
                    .subscribe((entry: ReferenceDataEntryModel) => {
                        this.entry = entry;

                        // add new breadcrumbs
                        const categoryName = _.get(entry, 'category.name');
                        if (categoryName) {
                            // link to Category
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(categoryName, `/reference-data/${params.categoryId}`)
                            );
                        }
                        // current page title
                        this.breadcrumbs.push(
                                new BreadcrumbItemModel(entry.value, '.', true)
                        );

                    });
            });
    }

    modifyEntry(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get selected outbreak
        this.referenceDataDataService
            .modifyEntry(this.entryId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE');

                // navigate to listing page
                this.router.navigate([`/reference-data/${this.categoryId}`]);
            });
    }

    /**
     * Check if we have access to modify reference data
     * @returns {boolean}
     */
    hasReferenceDataWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }
}
