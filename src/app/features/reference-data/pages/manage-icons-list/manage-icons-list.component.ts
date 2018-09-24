import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import { IconModel } from '../../../../core/models/icon.model';
import { Observable } from 'rxjs/Observable';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-manage-icons-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './manage-icons-list.component.html',
    styleUrls: ['./manage-icons-list.component.less']
})
export class ManageIconsListComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [];

    /**
     * Category Name
     */
    category: ReferenceDataCategoryModel;

    /**
     * Icons
     */
    iconsList$: Observable<IconModel[]>;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private iconDataService: IconDataService,
        private dialogService: DialogService,
        private snackbarService: SnackbarService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the query params
        this.route.queryParams
            .subscribe((params: { categoryId }) => {
                // retrieve Reference Data Category info
                if (!params.categoryId) {
                    // add breadcrumbs
                    this.addBreadcrumbs();
                } else {
                    this.retrieveCategory(params.categoryId);
                }
            });

        // retrieve icons
        this.refreshList();
    }

    /**
     * Add breadcrumbs
     */
    addBreadcrumbs() {
        // initialize
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
                '/reference-data'
            )
        ];

        // add category if necessary
        if (this.category) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.category.name,
                    `/reference-data/${this.category.id}`
                )
            );
        }

        // add manage icons breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_TITLE',
                '',
                true
            )
        );

    }

    /**
     * Retrieve category
     * @param categoryId
     */
    retrieveCategory(categoryId: string) {
        this.referenceDataDataService
            .getReferenceDataByCategory(categoryId)
            .subscribe((category: ReferenceDataCategoryModel) => {
                // set category
                this.category = category;

                // add breadcrumbs
                this.addBreadcrumbs();
            });
    }

    /**
     * Retrieve Icons
     */
    refreshList() {
        this.iconsList$ = this.iconDataService
            .getIconsList(this.queryBuilder);
    }

    /**
     * Table columns
     */
    getTableColumns(): string[] {
        return [
            'name',
            'icon',
            'actions'
        ];
    }

    /**
     * Delete Icon
     * @param icon
     */
    deleteIcon(icon: IconModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ICON', icon)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete case
                    this.iconDataService
                        .deleteIcon(icon.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
