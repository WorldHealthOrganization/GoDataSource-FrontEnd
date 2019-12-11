import { Component, ViewEncapsulation } from '@angular/core';
import { CacheService } from '../../../../core/services/helper/cache.service';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';

@Component({
    selector: 'app-import-sync-package',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-sync-package.component.html',
    styleUrls: ['./import-sync-package.component.less']
})
export class ImportSyncPackageComponent {
    breadcrumbs: BreadcrumbItemModel[] = [];

    authUser: UserModel;

    allowedExtensions: string[] = [
        ImportDataExtension.ZIP
    ];

    importFileUrl: string = 'sync/import-database-snapshot';

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
        if (SystemSyncLogModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_TITLE', '/system-config/sync-logs')
            );
        }

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_SYNC_PACKAGE_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished import
     */
    finished() {
        this.router.navigate(['/system-config/backups']);
    }
}
