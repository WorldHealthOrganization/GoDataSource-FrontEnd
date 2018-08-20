import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-reference-data-category-entries-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-category-entries-list.component.html',
    styleUrls: ['./reference-data-category-entries-list.component.less']
})
export class ReferenceDataCategoryEntriesListComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '.')
    ];

    categoryEntries$: Observable<ReferenceDataEntryModel[]>;
    categoryId: ReferenceDataCategory;

    authUser: UserModel;

    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private authDataService: AuthDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        // get the route params
        this.route.params
            .subscribe((params: { categoryId, phase }) => {
                this.categoryId = params.categoryId;

                this.refreshList();

                // retrieve Reference Data Category info
                this.referenceDataDataService
                    .getReferenceDataByCategory(params.categoryId)
                    .subscribe((category: ReferenceDataCategoryModel) => {
                        // add new breadcrumb
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(category.name, '.', true)
                        );
                    });
            });
    }

    refreshList() {
        if (this.categoryId) {
            this.categoryEntries$ = this.referenceDataDataService
                .getReferenceDataByCategory(this.categoryId)
                .map((category: ReferenceDataCategoryModel) => {
                    return category.entries;
                });
        }
    }

    deleteEntry(entry: ReferenceDataEntryModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_REFERENCE_DATA_ENTRY')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete entry
                    this.referenceDataDataService
                        .deleteEntry(entry.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY_SUCCESS_MESSAGE');

                            // reload data
                            this.refreshList();
                        });
                }
            });
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['label', 'description', 'icon', 'color', 'active', 'actions'];

        return columns;
    }
    /**
     * Check if we have access to modify reference data
     * @returns {boolean}
     */
    hasReferenceDataWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }
}
