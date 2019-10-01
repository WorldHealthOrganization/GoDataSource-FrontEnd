import { Component, ViewEncapsulation } from '@angular/core';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
    selector: 'app-import-hierarchical-locations',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-hierarchical-locations.component.html',
    styleUrls: ['./import-hierarchical-locations.component.less']
})
export class ImportHierarchicalLocationsComponent {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LOCATIONS_TITLE',
            '/locations'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_HIERARCHICAL_LOCATIONS_TITLE',
            '',
            true
        )
    ];


    allowedExtensions: string[] = [
        ImportDataExtension.XML,
        ImportDataExtension.JSON
    ];

    importFileUrl: string = 'locations/import';

    /**
     * Constructor
     * @param router
     * @param route
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
