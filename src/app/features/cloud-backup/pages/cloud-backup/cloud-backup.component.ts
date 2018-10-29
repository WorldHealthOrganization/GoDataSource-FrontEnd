import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-cloud-backup',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cloud-backup.component.html',
    styleUrls: ['./cloud-backup.component.less'],
})

export class CloudBackupComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_CLOUD_BACKUP_TITLE', '.')
    ];

    cloudBackup: {
        install: string,
        backUp: string
    };

    constructor(
        private systemSettingsDataService: SystemSettingsDataService,
        private snackbarService: SnackbarService
    ) {
        this.systemSettingsDataService.getCloudBackupPaths()
            .subscribe((cloudBackup) => {
                this.cloudBackup = cloudBackup;
            });
    }

    ngOnInit() {

    }

    copyToClipBoard(textToCopy: string) {
        const textBox = document.createElement('textarea');
        textBox.style.position = 'fixed';
        textBox.style.left = '0';
        textBox.style.top = '0';
        textBox.style.opacity = '0';
        textBox.value = textToCopy;
        document.body.appendChild(textBox);
        textBox.focus();
        textBox.select();
        document.execCommand('copy');
        document.body.removeChild(textBox);
        this.snackbarService.showSuccess('LNG_PAGE_CLOUD_BACKUP_ACTION_COPY_PATH_SUCCESS_MESSAGE');
    }
}
