import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { Router } from '@angular/router';
import { Constants } from '../../../../core/models/constants';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-import-contact-of-contact-data',
  templateUrl: './import-contact-of-contact-data.component.html'
})
export class ImportContactOfContactDataComponent implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  outbreakSubscriber: Subscription;

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

  displayLoading: boolean = true;

  importFileUrl: string = '';
  importDataUrl: string = '';

  ImportServerModelNames = ImportServerModelNames;

  fieldsWithoutTokens = {
    relationship: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP',
    'addresses[]': 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
    'documents[]': 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS',
    'relationship.persons[]': 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP_PERSONS',
    'vaccinesReceived[]': 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED',
    'age': 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',

    // !must be empty token - logic depends on it!
    'addresses[].geoLocation': ''
  };

  addressFields = {
    'addresses[].locationId': true
  };

  requiredDestinationFields: string[] = [
    'firstName',
    'relationship.persons[].id'
  ];

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService,
    private redirectService: RedirectService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // update breadcrumbs
    this.initializeBreadcrumbs();

    // get number of deceased cases
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak && selectedOutbreak.id) {
          // set URLs
          this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
          this.importDataUrl = `outbreaks/${selectedOutbreak.id}/contacts-of-contacts/import-importable-file-using-map`;

          // display import form
          this.displayLoading = false;
        }
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
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

    // add list breadcrumb only if we have permission
    if (ContactOfContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_CONTACT_OF_CONTACT_DATA_TITLE',
      action: null
    });
  }

  /**
     * Finished import
     */
  finished() {
    if (ContactOfContactModel.canList(this.authUser)) {
      this.router.navigate(['/contacts-of-contacts']);
    } else {
      // fallback
      this.redirectService.to(['/import-export-data/contact-of-contact-data/import']);
    }
  }
}
