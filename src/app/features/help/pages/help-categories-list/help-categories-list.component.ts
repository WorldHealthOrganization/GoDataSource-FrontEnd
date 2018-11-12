import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';

@Component({
    selector: 'app-help-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-categories-list.component.html',
    styleUrls: ['./help-categories-list.component.less']
})
export class HelpCategoriesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of categories
    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // provide constants to template
    Constants = Constants;

    constructor(
        private helpDataService: HelpDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService,
        private route: ActivatedRoute
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'order',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Re(load) the categories list
     */
    refreshList() {
        // retrieve the list of Categories
        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList(this.queryBuilder);
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {

    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_HELP);
    }

    /**
     * Delete specific category
     * @param {HelpCategoryModel} category
     */
    deleteHelpCategory(category: HelpCategoryModel) {
        // show confirm dialog
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HELP_CATEGORY', event)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.helpDataService
                        .deleteHelpCategory(category.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

}
