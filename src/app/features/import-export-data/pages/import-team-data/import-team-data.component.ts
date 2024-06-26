import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { TeamModel } from '../../../../core/models/team.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-import-team-data',
  templateUrl: './import-team-data.component.html'
})
export class ImportTeamDataComponent implements OnInit, OnDestroy {
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

  addressFields = {
    'locationIds[]': true
  };

  userFields = {
    'userIds[]': true
  };

  requiredDestinationFields: string[] = [
    'name',
    'userIds[]',
    'locationIds[]'
  ];

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private authDataService: AuthDataService,
    private redirectService: RedirectService,
    protected toastV2Service: ToastV2Service
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

    // show the warning message
    this.toastV2Service.notice(
      'LNG_PAGE_IMPORT_TEAM_DATA_WARNING',
      undefined,
      AppMessages.APP_MESSAGE_IMPORT_TEAM_DATA_WARNING
    );
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_IMPORT_TEAM_DATA_WARNING);
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
    if (TeamModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_TEAMS_TITLE',
        action: {
          link: ['/teams']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_TEAM_DATA_TITLE',
      action: null
    });
  }

  /**
   * Finished import
   */
  finished() {
    if (TeamModel.canList(this.authUser)) {
      this.router.navigate(['/teams']);
    } else {
      // fallback
      this.redirectService.to(['/import-export-data/team-data/import']);
    }
  }
}
