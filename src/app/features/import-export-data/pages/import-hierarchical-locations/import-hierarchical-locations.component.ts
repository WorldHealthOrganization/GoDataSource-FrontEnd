import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { LocationModel } from '../../../../core/models/location.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
  selector: 'app-import-hierarchical-locations',
  templateUrl: './import-hierarchical-locations.component.html'
})
export class ImportHierarchicalLocationsComponent {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  authUser: UserModel;

  allowedExtensions: string[] = [
    ImportDataExtension.JSON
  ];

  importFileUrl: string = 'locations/import';

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
      label: 'LNG_PAGE_IMPORT_HIERARCHICAL_LOCATIONS_TITLE',
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
      this.redirectService.to(['/import-export-data/hierarchical-locations/import']);
    }
  }
}
