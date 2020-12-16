import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { CaseChronology } from './typings/case-chronology';
import { forkJoin } from 'rxjs/index';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-view-chronology-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-chronology-case.component.html',
    styleUrls: ['./view-chronology-case.component.less']
})
export class ViewChronologyCaseComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    caseData: CaseModel = new CaseModel();
    chronologyEntries: ChronologyItem[] = [];

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private labResultDataService: LabResultDataService,
        private i18nService: I18nService,
        private relationshipDataService: RelationshipDataService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { caseId }) => {
            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // get case
                    this.caseDataService
                        .getCase(selectedOutbreak.id, params.caseId)
                        .subscribe((caseDataReturned) => {
                            this.caseData = caseDataReturned;

                            // initialize page breadcrumbs
                            this.initializeBreadcrumbs();

                            const qb = new RequestQueryBuilder();
                            qb.include('people', true);

                            forkJoin(
                                // get relationships
                                this.relationshipDataService
                                    .getEntityRelationships(
                                        selectedOutbreak.id,
                                        this.caseData.type,
                                        this.caseData.id,
                                        qb
                                    ),
                                // lab sample taken and lab result dates
                                this.labResultDataService
                                    .getEntityLabResults(
                                        selectedOutbreak.id,
                                        EntityModel.getLinkForEntityType(EntityType.CASE),
                                        this.caseData.id
                                    )
                            ).subscribe(([
                                relationshipData,
                                labResults
                            ]: [
                                RelationshipModel[],
                                LabResultModel[]
                            ]) => {
                                // set data
                                this.chronologyEntries = CaseChronology.getChronologyEntries(
                                    this.i18nService,
                                    this.caseData,
                                    labResults,
                                    relationshipData
                                );
                            });
                        });
                });
        });

        // initialize page breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // case list page
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // case breadcrumbs
        if (this.caseData) {
            // case view page
            if (CaseModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.caseData.name,
                        `/cases/${this.caseData.id}/view`
                    )
                );
            }

            // current page
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_VIEW_CHRONOLOGY_CASE_TITLE',
                    '.',
                    true,
                    {},
                    this.caseData
                )
            );
        }
    }
}
