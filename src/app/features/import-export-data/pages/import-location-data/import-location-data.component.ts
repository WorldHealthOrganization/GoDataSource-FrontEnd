import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Constants } from '../../../../core/models/constants';
import { ImportDataExtension } from '../../components/import-data/model';
import { LocationModel } from '../../../../core/models/location.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-import-case-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-location-data.component.html',
    styleUrls: ['./import-location-data.component.less']
})
export class ImportLocationDataComponent {
    breadcrumbs: BreadcrumbItemModel[] = [];

    Constants = Constants;

    authUser: UserModel;

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

    fieldsWithoutTokens = {
        'identifiers[]': 'LNG_LOCATION_FIELD_LABEL_IDENTIFIERS'
    };

    addressFields = {
        'parentLocationId': true
    };

    /**
     * Constructor
     */
    constructor(
        private cacheService: CacheService,
        private router: Router,
        private authDataService: AuthDataService,
        private redirectService: RedirectService
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
                'LNG_PAGE_IMPORT_LOCATION_DATA_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished import
     */
    finished() {
        // remove cached locations
        this.cacheService.remove(CacheKey.LOCATIONS);

        // redirect
        if (LocationModel.canList(this.authUser)) {
            this.router.navigate(['/locations']);
        } else {
            // fallback
            this.redirectService.to(['/import-export-data/location-data/import']);
        }
    }
}
