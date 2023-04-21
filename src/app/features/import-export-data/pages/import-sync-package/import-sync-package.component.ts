import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-import-sync-package',
  templateUrl: './import-sync-package.component.html'
})
export class ImportSyncPackageComponent {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  authUser: UserModel;

  allowedExtensions: string[] = [
    ImportDataExtension.ZIP
  ];

  importFileUrl: string = 'sync/import-database-snapshot';

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private authDataService: AuthDataService,
    private redirectService: RedirectService,
    private i18nService: I18nService
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
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // add list breadcrumb only if we have permission
    if (SystemSyncLogModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_TITLE',
        action: {
          link: ['/system-config/sync-logs']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_SYNC_PACKAGE_TITLE',
      action: null
    });
  }

  /**
     * Finished import
     */
  finished() {
    // reload all translations
    this.i18nService
      .loadUserLanguage(true)
      .subscribe(() => {
        // redirect
        if (SystemSyncLogModel.canList(this.authUser)) {
          this.router.navigate(['/system-config/sync-logs']);
        } else {
          // fallback
          this.redirectService.to(['/import-export-data/sync-package/import']);
        }
      });
  }
}
