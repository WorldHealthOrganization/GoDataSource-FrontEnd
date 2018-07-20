import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from '../../../../core/models/entity.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';


@Component({
    selector: 'app-case-relationships-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-relationships-list.component.html',
    styleUrls: ['./case-relationships-list.component.less']
})
export class CaseRelationshipsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    // selected outbreak ID
    outbreakId: string;
    // route param
    caseId: string;
    // list of relationships
    relationshipsList$: Observable<RelationshipModel[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService
    ) {
        super();
    }

    ngOnInit() {

        this.route.params.subscribe(params => {
            this.caseId = params.caseId;

            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.outbreakId = selectedOutbreak.id;

                    this.refreshList();

                    // get case data
                    this.caseDataService
                        .getCase(this.outbreakId, this.caseId)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            // Case not found; navigate back to Cases list
                            this.router.navigate(['/cases']);

                            return ErrorObservable.create(err);
                        })
                        .subscribe((caseData: CaseModel) => {
                            // add new breadcrumb: Case Modify page
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(caseData.name, `/cases/${this.caseId}/modify`)
                            );
                            // add new breadcrumb: page title
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_RELATIONSHIPS_TITLE', '.', true)
                            );
                        });
                });
        });
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.outbreakId && this.caseId) {

            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.include('people');

            qb.merge(this.queryBuilder);

            // retrieve the list of Relationships
            this.relationshipsList$ = this.relationshipDataService.getEntityRelationships(
                this.outbreakId,
                EntityType.CASE,
                this.caseId,
                qb
            );
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'personName', 'contactDate', 'certaintyLevel', 'exposureType',
            'exposureFrequency', 'exposureDuration', 'relation', 'actions'
        ];

        return columns;
    }

}
