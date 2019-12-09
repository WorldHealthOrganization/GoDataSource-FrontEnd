import { Component, ViewEncapsulation } from '@angular/core';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { LocationModel } from '../../../../core/models/location.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
    selector: 'app-import-hierarchical-locations',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-hierarchical-locations.component.html',
    styleUrls: ['./import-hierarchical-locations.component.less']
})
export class ImportHierarchicalLocationsComponent {
    breadcrumbs: BreadcrumbItemModel[] = [];

    authUser: UserModel;

    allowedExtensions: string[] = [
        ImportDataExtension.XML,
        ImportDataExtension.JSON
    ];

    importFileUrl: string = 'locations/import';

    /**
     * Constructor
     */
    constructor(
        private cacheService: CacheService,
        private router: Router,
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // update breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (LocationModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_LOCATIONS_TITLE', '/locations')
            );
        }

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_HIERARCHICAL_LOCATIONS_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished import
     */
    finished() {
        this.cacheService.remove(CacheKey.LOCATIONS);
        this.router.navigate(['/locations']);
    }
}
