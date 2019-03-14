import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';

@Component({
    selector: 'app-version',
    templateUrl: './version.component.html',
    styleUrls: ['./version.component.less']
})
export class VersionComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_VERSION_TITLE', '.')
    ];

    version: string;

    constructor(
        private systemSettingsDataService: SystemSettingsDataService
    ) {
    }

    ngOnInit() {
        this.systemSettingsDataService.getVersionNumber()
            .subscribe((versionData: { version: string }) => {
                this.version = versionData.version;
            });
    }

}
