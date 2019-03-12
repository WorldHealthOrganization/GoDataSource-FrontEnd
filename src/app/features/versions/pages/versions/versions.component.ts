import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';

@Component({
    selector: 'app-versions',
    templateUrl: './versions.component.html',
    styleUrls: ['./versions.component.less']
})
export class VersionsComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_VERSIONS_TITLE', '.')
    ];

    version: string;

    constructor(
        private systemSettingsDataService: SystemSettingsDataService
    ) {
    }

    ngOnInit() {
        this.systemSettingsDataService.getVersionsNumber()
            .subscribe((versionData: { version: string }) => {
                this.version = versionData.version;
            });
    }

}
