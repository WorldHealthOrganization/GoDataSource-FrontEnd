import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ImportDataExtension, ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
    selector: 'app-import-case-lab-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-case-lab-data.component.html',
    styleUrls: ['./import-case-lab-data.component.less']
})
export class ImportCaseLabDataComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_CASES_TITLE',
            '/cases',
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_CASE_LAB_DATA_TITLE',
            '',
            true
        )
    ];

    allowedExtensions: string[] = [
        ImportDataExtension.CSV,
        ImportDataExtension.XLS,
        ImportDataExtension.XLSX,
        ImportDataExtension.XML,
        ImportDataExtension.ODS,
        ImportDataExtension.JSON
    ];

    displayLoading: boolean = true;

    importFileUrl: string = '';
    importDataUrl: string = '';

    ImportServerModelNames = ImportServerModelNames;

    fieldsWithoutTokens = {
        questionnaireAnswers: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS'
    };

    requiredDestinationFields = [
        'personId',
        'dateSampleTaken'
    ];

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private router: Router,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get number of deceased cases
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    // set URLs
                    this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
                    this.importDataUrl = `outbreaks/${selectedOutbreak.id}/cases/lab-results/import-importable-file-using-map`;

                    // display import form
                    this.displayLoading = false;
                }
            });
    }

    finished() {
        this.router.navigate(['/cases']);
    }
}
