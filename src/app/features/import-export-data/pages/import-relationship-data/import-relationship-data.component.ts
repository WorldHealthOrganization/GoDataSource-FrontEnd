import { Component, OnDestroy, OnInit } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-import-relationship-data',
  templateUrl: './import-relationship-data.component.html'
})
export class ImportRelationshipDataComponent implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  authUser: UserModel;

  outbreakSubscriber: Subscription;

  selectedOutbreak: OutbreakModel;

  displayLoading: boolean = true;

  fromPage: string;

  // Constants for template usage
  Constants = Constants;

  title: string;

  allowedExtensions: string[] = [
    ImportDataExtension.CSV,
    ImportDataExtension.XLS,
    ImportDataExtension.XLSX,
    ImportDataExtension.ODS,
    ImportDataExtension.JSON,
    ImportDataExtension.ZIP
  ];

  importFileUrl: string = '';
  importDataUrl: string = '';

  ImportServerModelNames = ImportServerModelNames;

  requiredDestinationFields: string[] = [
    'contactDate'
  ];

  fieldsWithoutTokens = {
    'persons[]': 'LNG_CONTACT_FIELD_LABEL_RELATIONSHIP_PERSONS'
  };

  /**
     * Constructor
     */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authDataService: AuthDataService,
    private outbreakDataService: OutbreakDataService,
    private redirectService: RedirectService
  ) {
  }

  /**
     * Initialize component elements
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.route.queryParams
      .subscribe((queryParams: { from: string }) => {
        // set the page that redirected to import relationship
        this.fromPage = queryParams.from;

        // update breadcrumbs and set the import title
        this.initializeBreadcrumbs();
      });

    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak && selectedOutbreak.id) {
          // outbreak
          this.selectedOutbreak = selectedOutbreak;

          // set URLs
          this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
          this.importDataUrl = `outbreaks/${selectedOutbreak.id}/relationships/import-importable-file-using-map`;

          // display import form
          this.displayLoading = false;
        }
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy(): void {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
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

    // add breadcrumbs based on what page redirected to import relationship data
    switch (this.fromPage) {
      case Constants.APP_PAGE.CASES.value:
        // update import title
        this.title = 'LNG_PAGE_IMPORT_CASE_RELATIONSHIP_DATA_TITLE';

        // add list breadcrumb only if we have permission
        if (CaseModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CASES_TITLE',
            action: {
              link: ['/cases']
            }
          });
        }

        // import breadcrumb
        this.breadcrumbs.push({
          label: 'LNG_PAGE_IMPORT_CASE_RELATIONSHIP_DATA_TITLE',
          action: null
        });
        break;
      case Constants.APP_PAGE.CONTACTS.value:
        // update import title
        this.title = 'LNG_PAGE_IMPORT_CONTACT_RELATIONSHIP_DATA_TITLE';

        // add list breadcrumb only if we have permission
        if (ContactModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
            action: {
              link: ['/contacts']
            }
          });
        }

        // import breadcrumb
        this.breadcrumbs.push({
          label: 'LNG_PAGE_IMPORT_CONTACT_RELATIONSHIP_DATA_TITLE',
          action: null
        });
        break;
      case Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value:
        // update import title
        this.title = 'LNG_PAGE_IMPORT_CONTACT_OF_CONTACT_RELATIONSHIP_DATA_TITLE';

        // add list breadcrumb only if we have permission
        if (ContactOfContactModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
            action: {
              link: ['/contacts-of-contacts']
            }
          });
        }

        // import breadcrumb
        this.breadcrumbs.push({
          label: 'LNG_PAGE_IMPORT_CONTACT_OF_CONTACT_RELATIONSHIP_DATA_TITLE',
          action: null
        });
        break;
      case Constants.APP_PAGE.EVENTS.value:
        // update import title
        this.title = 'LNG_PAGE_IMPORT_EVENT_RELATIONSHIP_DATA_TITLE';

        // add list breadcrumb only if we have permission
        if (EventModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_EVENTS_TITLE',
            action: {
              link: ['/events']
            }
          });
        }

        // import breadcrumb
        this.breadcrumbs.push({
          label: 'LNG_PAGE_IMPORT_EVENT_RELATIONSHIP_DATA_TITLE',
          action: null
        });
        break;
    }
  }

  /**
     * Finished
     */
  finished() {
    // after import redirect to initial page
    switch (this.fromPage) {
      case Constants.APP_PAGE.CASES.value:
        if (CaseModel.canList(this.authUser)) {
          this.router.navigate(['/cases']);
        } else {
          this.redirectService.to(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
              from: Constants.APP_PAGE.CASES.value
            }
          });
        }
        break;
      case Constants.APP_PAGE.CONTACTS.value:
        if (ContactModel.canList(this.authUser)) {
          this.router.navigate(['/contacts']);
        } else {
          this.redirectService.to(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
              from: Constants.APP_PAGE.CONTACTS.value
            }
          });
        }
        break;
      case Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value:
        if (ContactOfContactModel.canList(this.authUser)) {
          this.router.navigate(['/contacts-of-contacts']);
        } else {
          this.redirectService.to(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
              from: Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value
            }
          });
        }
        break;
      case Constants.APP_PAGE.EVENTS.value:
        if (EventModel.canList(this.authUser)) {
          this.router.navigate(['/events']);
        } else {
          this.redirectService.to(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
              from: Constants.APP_PAGE.EVENTS.value
            }
          });
        }
        break;
    }
  }
}
