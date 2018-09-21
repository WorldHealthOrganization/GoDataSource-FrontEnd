import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';

@Component({
    selector: 'app-manage-icons-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './manage-icons-list.component.html',
    styleUrls: ['./manage-icons-list.component.less']
})
export class ManageIconsListComponent extends ConfirmOnFormChanges implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [];

    /**
     * Category Name
     */
    category: ReferenceDataCategoryModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService
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
}
