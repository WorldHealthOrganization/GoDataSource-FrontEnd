import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { ReportCasesWithOnsetModel } from '../../../../core/models/report-cases-with-onset.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-report-cases-date-onset-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-cases-date-onset-list.component.html',
    styleUrls: ['./report-cases-date-onset-list.component.less']
})
export class ReportCasesDateOnsetListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE', '', true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of secondary cases with onset date that is before the date of onset of the primary case
    casesWithOnsetList$: Observable<ReportCasesWithOnsetModel[]>;

    // provide constants to template
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    constructor(
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private relationshipDataService: RelationshipDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // refresh
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.casesWithOnsetList$ = this.relationshipDataService.getCasesWithDateOnsetBeforePrimaryCase(this.selectedOutbreak.id)
                .pipe(tap(this.checkEmptyList.bind(this)));
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'primaryCase.firstName',
            'primaryCase.lastName',
            'primaryCase.dateOfOnset',
            'primaryCase.classification',
            'secondaryCase.firstName',
            'secondaryCase.lastName',
            'secondaryCase.dateOfOnset',
            'secondaryCase.classification',
            'actions'
        ];
    }
}
