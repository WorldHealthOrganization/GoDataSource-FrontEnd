import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import {
  UserModel,
  UserRoleModel
} from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-import-user-role-data',
  templateUrl: './import-user-role-data.component.html'
})
export class ImportUserRoleDataComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  // constants for template usage
  ImportServerModelNames = ImportServerModelNames;

  // models
  authUser: UserModel;

  // allowed extensions
  allowedExtensions: string[] = [
    ImportDataExtension.CSV,
    ImportDataExtension.XLS,
    ImportDataExtension.XLSX,
    ImportDataExtension.ODS,
    ImportDataExtension.JSON,
    ImportDataExtension.ZIP
  ];

  requiredDestinationFields = [
    'name',
    'permissionIds[]'
  ];

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private authDataService: AuthDataService,
    private redirectService: RedirectService
  ) {
  }

  /**
   * Component initialized
   */
  ngOnInit() {
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
    if (UserRoleModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_USER_ROLES_TITLE',
        action: {
          link: ['/user-roles']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_USER_ROLE_DATA_TITLE',
      action: null
    });
  }

  /**
   * Finished import
   */
  finished() {
    if (UserRoleModel.canList(this.authUser)) {
      this.router.navigate(['/user-roles']);
    } else {
      // fallback
      this.redirectService.to(['/import-export-data/user-role-data/import']);
    }
  }
}
