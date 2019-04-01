import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';

@Component({
    selector: 'app-version',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './version.component.html',
    styleUrls: ['./version.component.less']
})
export class VersionComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_VERSION_TITLE', '.')
    ];

    versionData: SystemSettingsVersionModel;

    constructor(
        private systemSettingsDataService: SystemSettingsDataService
    ) {
    }

    ngOnInit() {
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((versionData) => {
                this.versionData = versionData;
            });
    }

}
