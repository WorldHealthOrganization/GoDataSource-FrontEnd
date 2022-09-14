import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportDataExtension } from '../../components/import-data/model';
import { LanguageModel } from '../../../../core/models/language.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-import-language-tokens',
  templateUrl: './import-language-tokens.component.html'
})
export class ImportLanguageTokensComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  authUser: UserModel;

  allowedExtensions: string[] = [
    ImportDataExtension.XLSX
  ];

  importFileUrl: string;

  // language
  language: LanguageModel;

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    protected activatedRoute: ActivatedRoute,
    private authDataService: AuthDataService,
    private redirectService: RedirectService
  ) {
    // get data
    this.language = activatedRoute.snapshot.data.language;
    this.importFileUrl = `/languages/${this.language.id}/language-tokens/import`;
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
    if (LanguageModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LANGUAGES_TITLE',
        action: {
          link: ['/languages']
        }
      });
    }

    // add list breadcrumb only if we have permission
    if (LanguageModel.canView(this.authUser)) {
      this.breadcrumbs.push({
        label: this.language.name,
        action: {
          link: ['/languages', this.language.id, 'view']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_LANGUAGE_TOKENS_TITLE',
      action: null
    });
  }

  /**
     * Finished import
     */
  finished() {
    // redirect
    if (LanguageModel.canList(this.authUser)) {
      this.router.navigate(['/languages']);
    } else {
      // fallback
      this.redirectService.to([`/import-export-data/language-data/${this.language.id}/import-tokens`]);
    }
  }
}
