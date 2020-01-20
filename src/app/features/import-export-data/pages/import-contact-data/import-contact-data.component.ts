import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ImportServerModelNames } from '../../components/import-data/import-data.component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { ImportDataExtension } from '../../components/import-data/model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-import-contact-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-contact-data.component.html',
    styleUrls: ['./import-contact-data.component.less']
})
export class ImportContactDataComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    outbreakSubscriber: Subscription;

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

    displayLoading: boolean = true;

    importFileUrl: string = '';
    importDataUrl: string = '';

    ImportServerModelNames = ImportServerModelNames;

    fieldsWithoutTokens = {
        relationship: 'LNG_CONTACT_FIELD_LABEL_RELATIONSHIP',
        'addresses[]': 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        'documents[]': 'LNG_CONTACT_FIELD_LABEL_DOCUMENTS',
        'relationship.persons[]': 'LNG_CONTACT_FIELD_LABEL_RELATIONSHIP_PERSONS',
        'vaccinesReceived[]': 'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED',

        // !must be empty token - logic depends on it!
        'addresses[].geoLocation': ''
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
                    this.importDataUrl = `outbreaks/${selectedOutbreak.id}/contacts/import-importable-file-using-map`;

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

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_CONTACT_DATA_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished import
     */
    finished() {
        if (ContactModel.canList(this.authUser)) {
            this.router.navigate(['/contacts']);
        } else {
            // fallback
            this.redirectService.to(['/import-export-data/contact-data/import']);
        }
    }
}
