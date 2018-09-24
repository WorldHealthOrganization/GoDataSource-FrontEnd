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
import { EntityType } from '../../../../core/models/entity-type';
import { ReportDifferenceOnsetRelationshipModel } from '../../../../core/models/relationship.model';

@Component({
    selector: 'app-report-relationships-long-period',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './report-relationships-long-period-list.component.html',
    styleUrls: ['./report-relationships-long-period-list.component.less']
})
export class ReportRelationshipsLongPeriodListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE', '', true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
    relationshipList$: Observable<ReportDifferenceOnsetRelationshipModel[]>;

    // provide constants to template
    EntityType = EntityType;

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private relationshipDataService: RelationshipDataService
    ) {
        super();
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
            this.relationshipList$ = this.relationshipDataService.getLongPeriodBetweenDateOfOnset(this.selectedOutbreak.id);
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
            'people[0].firstName',
            'people[0].lastName',
            'people[0].dateOfOnset',
            'people[1].firstName',
            'people[1].lastName',
            'people[1].dateOfOnset',
            'differenceBetweenDatesOfOnset',
            'actions'
        ];
    }
}
