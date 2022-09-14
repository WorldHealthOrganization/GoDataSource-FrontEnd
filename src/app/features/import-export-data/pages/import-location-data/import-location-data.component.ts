import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { Constants } from '../../../../core/models/constants';
import { ImportDataExtension } from '../../components/import-data/model';
import { LocationModel } from '../../../../core/models/location.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-import-case-data',
  templateUrl: './import-location-data.component.html'
})
export class ImportLocationDataComponent {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  Constants = Constants;

  authUser: UserModel;

  allowedExtensions: string[] = [
    ImportDataExtension.CSV,
    ImportDataExtension.XLS,
    ImportDataExtension.XLSX,
    ImportDataExtension.ODS,
    ImportDataExtension.JSON,
    ImportDataExtension.ZIP
  ];

  ImportServerModelNames = ImportServerModelNames;

  requiredDestinationFields = [
    'name',
    'geographicalLevelId'
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
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // add list breadcrumb only if we have permission
    if (LocationModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: {
          link: ['/locations']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_LOCATION_DATA_TITLE',
      action: null
    });
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
