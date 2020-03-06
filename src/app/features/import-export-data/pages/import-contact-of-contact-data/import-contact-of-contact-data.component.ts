import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { QuestionModel } from '../../../../core/models/question.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { UserModel } from '../../../../core/models/user.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { Router } from '@angular/router';
import { Constants } from '../../../../core/models/constants';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';

@Component({
    selector: 'app-import-contact-of-contact-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-contact-of-contact-data.component.html',
    styleUrls: ['./import-contact-of-contact-data.component.less']
})
export class ImportContactOfContactDataComponent implements OnInit, OnDestroy {

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    Constants = Constants;

    authUser: UserModel;

    allowedExtensions: string[] = [
        ImportDataExtension.CSV,
        ImportDataExtension.XLS,
        ImportDataExtension.XLSX,
        ImportDataExtension.XML,
        ImportDataExtension.ODS,
        ImportDataExtension.JSON
    ];

    outbreakSubscriber: Subscription;

    displayLoading: boolean = true;

    importFileUrl: string = '';
    importDataUrl: string = '';

    ImportServerModelNames = ImportServerModelNames;

    fieldsWithoutTokens = {
        questionnaireAnswers: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS'
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
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CONTACTS_TITLE',
                    '/contacts'
                )
            );
        }

        // add list breadcrumb only if we have permission
        if (LabResultModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
                    '/lab-results'
                )
            );
        }

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_CONTACT_LAB_DATA_TITLE',
                '.',
                true
            )
        );
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
