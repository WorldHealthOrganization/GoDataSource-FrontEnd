import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../../core/models/constants';
import { ImportDataExtension } from '../../components/import-data/model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
  selector: 'app-import-case-lab-data',
  templateUrl: './import-reference-data.component.html'
})
export class ImportReferenceDataComponent {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  allowedExtensions: string[] = [
    ImportDataExtension.CSV,
    ImportDataExtension.XLS,
    ImportDataExtension.XLSX,
    ImportDataExtension.ODS,
    ImportDataExtension.JSON,
    ImportDataExtension.ZIP
  ];

  Constants = Constants;

  importFileUrl: string = 'importable-files';
  importDataUrl: string = 'reference-data/import-importable-file-using-map';

  ImportServerModelNames = ImportServerModelNames;

  authUser: UserModel;

  requiredDestinationFields: string[] = [
    'categoryId',
    'value'
  ];

  /**
     * Constructor
     * @param router
     * @param route
     */
  constructor(
    private referenceDataDataService: ReferenceDataDataService,
    private router: Router,
    private i18nService: I18nService,
    authDataService: AuthDataService
  ) {
    // get the authenticated user
    this.authUser = authDataService.getAuthenticatedUser();

    // breadcrumbs
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
    this.breadcrumbs.push({
      label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
      action: {
        link: ['/reference-data']
      }
    });

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_REFERENCE_DATA_TITLE',
      action: null
    });
  }

  /**
     * Finished
     */
  finished() {
    // reload translations
    this.i18nService.loadUserLanguage().subscribe(() => {
      // clear cache
      this.referenceDataDataService.clearReferenceDataCache();

      // redirect
      this.router.navigate(['/reference-data']);
    });
  }
}
