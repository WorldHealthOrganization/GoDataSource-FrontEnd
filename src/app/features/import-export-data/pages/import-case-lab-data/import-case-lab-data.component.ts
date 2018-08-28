import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';

@Component({
    selector: 'app-import-case-lab-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-case-lab-data.component.html',
    styleUrls: ['./import-case-lab-data.component.less']
})
export class ImportCaseLabDataComponent implements OnInit {
    allowedMimeTypes: string[] = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/xml',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/json'
    ];

    allowedExtensions: string[] = [
        '.csv',
        '.xls',
        '.xlsx',
        '.xml',
        '.ods',
        '.json'
    ];

    displayLoading: boolean = true;

    importFileUrl: string = '';

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
                // get the results for contacts on the follow up list
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
                    this.displayLoading = false;
                }
            });
    }

    finished() {
        this.router.navigate(['/cases']);
    }
}
