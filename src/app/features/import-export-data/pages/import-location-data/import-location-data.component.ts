import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Constants } from '../../../../core/models/constants';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
    selector: 'app-import-case-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-location-data.component.html',
    styleUrls: ['./import-location-data.component.less']
})
export class ImportLocationDataComponent {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LOCATIONS_TITLE',
            '/locations'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_LOCATION_DATA_TITLE',
            '',
            true
        )
    ];

    Constants = Constants;

    allowedExtensions: string[] = [
        ImportDataExtension.CSV,
        ImportDataExtension.XLS,
        ImportDataExtension.XLSX,
        ImportDataExtension.XML,
        ImportDataExtension.ODS,
        ImportDataExtension.JSON
    ];

    ImportServerModelNames = ImportServerModelNames;

    requiredDestinationFields = [
        'name'
    ];

    /**
     * Constructor
     */
    constructor(
        private cacheService: CacheService,
        private router: Router
    ) {}

    finished() {
        this.cacheService.remove(CacheKey.LOCATIONS);
        this.router.navigate(['/locations']);
    }
}
