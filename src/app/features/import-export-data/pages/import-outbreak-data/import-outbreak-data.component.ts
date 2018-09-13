import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ImportDataExtension, ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
    selector: 'app-import-outbreak-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-outbreak-data.component.html',
    styleUrls: ['./import-outbreak-data.component.less']
})
export class ImportOutbreakDataComponent {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_CONTACTS_TITLE',
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

    importFileUrl: string = '';
    importDataUrl: string = '';

    ImportServerModelNames = ImportServerModelNames;

    fieldsWithoutTokens = {
    };

    requiredDestinationFields = [
    ];

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private router: Router
    ) {}

    finished() {
        this.router.navigate(['/outbreaks']);
    }
}
