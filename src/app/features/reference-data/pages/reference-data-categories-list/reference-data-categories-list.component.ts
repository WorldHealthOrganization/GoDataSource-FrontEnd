import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as moment from 'moment';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // list of entries grouped by category
    referenceData$: Observable<ReferenceDataCategoryModel[]>;

    referenceDataExporFileName: string = 'Reference Data - ' + moment().format('YYYY-MM-DD');

    constructor(
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        // load reference data
        this.referenceData$ = this.referenceDataDataService.getReferenceData();
    }

    /**
     * Implement abstract function
     */
    public refreshList() {
        // NOTHING
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'categoryName',
            'entries',
            'actions'
        ];
    }
}
