import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
  selector: 'app-cloud-backup',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cloud-backup.component.html',
  styleUrls: ['./cloud-backup.component.scss']
})

export class CloudBackupComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  cloudBackup: {
    install: string,
    backUp: string
  };

  // authenticated user
  private _authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service,
    authDataService: AuthDataService
  ) {
    // get the authenticated user
    this._authUser = authDataService.getAuthenticatedUser();
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.systemSettingsDataService
      .getCloudBackupPaths()
      .subscribe((cloudBackup) => {
        this.cloudBackup = cloudBackup;
      });

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this._authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // current page
    this.breadcrumbs.push({
      label: 'LNG_LAYOUT_MENU_ITEM_CLOUD_BACKUP_LABEL',
      action: null
    });
  }

  /**
     * Copy to clipboard
     */
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
    this.toastV2Service.success('LNG_PAGE_CLOUD_BACKUP_ACTION_COPY_PATH_SUCCESS_MESSAGE');
  }
}
