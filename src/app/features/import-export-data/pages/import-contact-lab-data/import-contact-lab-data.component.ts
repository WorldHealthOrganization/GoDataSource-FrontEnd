import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { QuestionModel } from '../../../../core/models/question.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { UserModel } from '../../../../core/models/user.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-import-contact-lab-data',
  templateUrl: './import-contact-lab-data.component.html'
})
export class ImportContactLabDataComponent implements OnInit, OnDestroy {
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

  outbreakSubscriber: Subscription;

  displayLoading: boolean = true;

  importFileUrl: string = '';
  importDataUrl: string = '';

  ImportServerModelNames = ImportServerModelNames;

  fieldsWithoutTokens = {
    questionnaireAnswers: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
    sequence: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
  };

  requiredDestinationFields = [
    'personId',
    'dateSampleTaken'
  ];

  formatDataBeforeUse = QuestionModel.formatQuestionnaireImportDefs;

  selectedOutbreak: OutbreakModel;

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
          // outbreak
          this.selectedOutbreak = selectedOutbreak;

          // set URLs
          this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
          this.importDataUrl = `outbreaks/${selectedOutbreak.id}/contacts/lab-results/import-importable-file-using-map`;

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
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // add list breadcrumb only if we have permission
    if (LabResultModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
        action: {
          link: ['/lab-results']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_IMPORT_CONTACT_LAB_DATA_TITLE',
      action: null
    });
  }

  /**
     * Finished
     */
  finished() {
    if (LabResultModel.canList(this.authUser)) {
      this.router.navigate(['/lab-results']);
    } else {
      // fallback
      this.redirectService.to(['/import-export-data/contact-lab-data/import']);
    }
  }
}
