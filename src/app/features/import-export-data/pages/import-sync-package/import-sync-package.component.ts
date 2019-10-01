import { Component, ViewEncapsulation } from '@angular/core';
import { CacheService } from '../../../../core/services/helper/cache.service';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
    selector: 'app-import-sync-package',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-sync-package.component.html',
    styleUrls: ['./import-sync-package.component.less']
})
export class ImportSyncPackageComponent {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_BACKUP_MODULE_LABEL_SYSTEM_CONFIGURATION',
            '/system-config/backups'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_SYNC_PACKAGE_TITLE',
            '',
            true
        )
    ];

    allowedExtensions: string[] = [
        ImportDataExtension.ZIP
    ];

    importFileUrl: string = 'sync/import-database-snapshot';

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
        this.router.navigate(['/system-config/backups']);
    }
}
