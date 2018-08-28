import { Component, ViewEncapsulation } from '@angular/core';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-import-hierarchical-locations',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-hierarchical-locations.component.html',
    styleUrls: ['./import-hierarchical-locations.component.less']
})
export class ImportHierarchicalLocationsComponent {
    allowedMimeTypes: string[] = [
        'text/xml',
        'application/json'
    ];

    allowedExtensions: string[] = [
        '.xml',
        '.json'
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
