import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
    selector: 'app-import-contact-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-contact-data.component.html',
    styleUrls: ['./import-contact-data.component.less']
})
export class ImportContactDataComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_CONTACTS_TITLE',
            '/contacts'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_CONTACT_DATA_TITLE',
            '',
            true
        )
    ];

    outbreakSubscriber: Subscription;

    Constants = Constants;

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
        relationship: 'LNG_CONTACT_FIELD_LABEL_RELATIONSHIP',
        'addresses[]': 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        'documents[]': 'LNG_CONTACT_FIELD_LABEL_DOCUMENTS',
        'relationship.persons[]': 'LNG_CONTACT_FIELD_LABEL_RELATIONSHIP_PERSONS',
        'vaccinesReceived[]': 'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED'
    };

    requiredDestinationFields = [
        'firstName',
        'dateOfReporting',
        'relationship.persons[].id',
        'relationship.contactDate',
        'relationship.certaintyLevelId'
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
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    // set URLs
                    this.importFileUrl = `outbreaks/${selectedOutbreak.id}/importable-files`;
                    this.importDataUrl = `outbreaks/${selectedOutbreak.id}/contacts/import-importable-file-using-map`;

                    // display import form
                    this.displayLoading = false;
                }
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    finished() {
        this.router.navigate(['/contacts']);
    }
}
