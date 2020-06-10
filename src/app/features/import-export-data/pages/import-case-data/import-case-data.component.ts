import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { QuestionModel } from '../../../../core/models/question.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { UserModel } from '../../../../core/models/user.model';
import { CaseModel } from '../../../../core/models/case.model';

@Component({
    selector: 'app-import-case-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-case-data.component.html',
    styleUrls: ['./import-case-data.component.less']
})
export class ImportCaseDataComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    outbreakSubscriber: Subscription;

    allowedExtensions: string[] = [
        ImportDataExtension.CSV,
        ImportDataExtension.XLS,
        ImportDataExtension.XLSX,
        ImportDataExtension.XML,
        ImportDataExtension.ODS,
        ImportDataExtension.JSON
    ];

    // Constants for template usage
    Constants = Constants;

    authUser: UserModel;

    displayLoading: boolean = true;

    importFileUrl: string = '';
    importDataUrl: string = '';

    ImportServerModelNames = ImportServerModelNames;

    fieldsWithoutTokens = {
        questionnaireAnswers: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        'addresses[]': 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        'documents[]': 'LNG_CASE_FIELD_LABEL_DOCUMENTS',
        'dateRanges[]': 'LNG_CASE_FIELD_LABEL_DATE_RANGES',
        'vaccinesReceived[]': 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED',

        // !must be empty token - logic depends on it!
        'addresses[].geoLocation': ''
    };

    addressFields = {
        'addresses[].locationId': true
    };

    requiredDestinationFields;

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

        // get number of deceased cases
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    // outbreak
                    this.selectedOutbreak = selectedOutbreak;

                    // set default required fields
                    this.requiredDestinationFields = [
                        'firstName',
                        'dateOfReporting',
                        'classification'
                    ];

                    // is dateOfOnset required for this outbreak ?
                    if (this.selectedOutbreak.isDateOfOnsetRequired) {
                        this.requiredDestinationFields.push('dateOfOnset');
                    }

                    // set URLs
                    this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
                    this.importDataUrl = `outbreaks/${selectedOutbreak.id}/cases/import-importable-file-using-map`;

                    // display import form
                    this.displayLoading = false;
                }
            });

        // update breadcrumbs
        this.initializeBreadcrumbs();
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
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CASES_TITLE',
                    '/cases'
                )
            );
        }

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_CASE_DATA_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished
     */
    finished() {
        if (CaseModel.canList(this.authUser)) {
            this.router.navigate(['/cases']);
        } else {
            // fallback
            this.redirectService.to(['/import-export-data/case-data/import']);
        }
    }
}
