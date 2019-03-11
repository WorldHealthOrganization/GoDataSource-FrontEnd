import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ImportDataExtension, ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-import-case-lab-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-reference-data.component.html',
    styleUrls: ['./import-reference-data.component.less']
})
export class ImportReferenceDataComponent {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
            '/reference-data',
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_REFERENCE_DATA_TITLE',
            '',
            true
        )
    ];

    allowedExtensions: string[] = [
        ImportDataExtension.CSV,
        ImportDataExtension.XLS,
        ImportDataExtension.XLSX,
        ImportDataExtension.XML,
        ImportDataExtension.ODS,
        ImportDataExtension.JSON
    ];

    Constants = Constants;

    importFileUrl: string = 'importable-files';
    importDataUrl: string = 'reference-data/import-importable-file-using-map';

    ImportServerModelNames = ImportServerModelNames;

    requiredDestinationFields = [
        'categoryId',
        'value'
    ];

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        private router: Router,
        private i18nService: I18nService
    ) {}

    /**
     * Finished
     */
    finished() {
        // reload translations
        this.i18nService.loadUserLanguage().subscribe(() => {
            // clear cache
            this.referenceDataDataService.clearReferenceDataCache();

            // redirect
            this.router.navigate(['/reference-data']);
        });
    }
}
