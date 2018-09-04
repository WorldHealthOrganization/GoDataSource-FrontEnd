import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ImportDataExtension } from '../../../import-export-data/components/import-data/import-data.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ImportExportService } from '../../../../core/services/data/import-export.service';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent extends ListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // list of entries grouped by category
    referenceData$: Observable<ReferenceDataCategoryModel[]>;

    constructor(
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        protected dialogService: DialogService,
        protected importExportService: ImportExportService
    ) {
        super(
            null,
            null,
            dialogService,
            importExportService
        );

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

    /**
     * Export reference data
     */
    exportReferenceData() {
        super.exportData(
            'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_EXPORT_TITLE',
            'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_EXPORT_TYPE',
            'reference-data/export',
            [
                ImportDataExtension.JSON,
                ImportDataExtension.ODS,
                ImportDataExtension.XML,
                ImportDataExtension.XLSX,
                ImportDataExtension.XLS,
                ImportDataExtension.CSV
            ]
        );
    }
}
