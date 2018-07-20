import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';

@Component({
    selector: 'app-modify-case-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case-relationship.component.html',
    styleUrls: ['./modify-case-relationship.component.less']
})
export class ModifyCaseRelationshipComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    // selected outbreak ID
    outbreakId: string;
    // route params
    caseId: string;
    relationshipId: string;

    relatedEntityType: string;
    relatedEntityId: string;
    relationshipData: RelationshipModel = new RelationshipModel();

    availableRelatedEntityTypes$: Observable<any[]>;
    personsList$: Observable<any[]>;
    personsQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    certaintyLevelOptions$: Observable<any[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureDurationOptions$: Observable<any[]>;
    socialRelationshipOptions$: Observable<any[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
    }

    ngOnInit() {
        this.availableRelatedEntityTypes$ = this.genericDataService.getAvailableRelatedEntityTypes(EntityType.CASE);
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL);
        this.exposureTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE);
        this.exposureFrequencyOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY);
        this.exposureDurationOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION);
        this.socialRelationshipOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION);

        this.route.params.subscribe(params => {
            this.caseId = params.caseId;
            this.relationshipId = params.relationshipId;

            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.outbreakId = selectedOutbreak.id;

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
                                new BreadcrumbItemModel(caseData.name, `/cases/${this.caseId}/modify`),
                            );
                            // add new breadcrumb: Relationships list page
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_RELATIONSHIPS_TITLE', `/cases/${this.caseId}/relationships`)
                            );

                            // get relationship data
                            this.relationshipDataService
                                .getEntityRelationship(this.outbreakId, EntityType.CASE, this.caseId, this.relationshipId)
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);

                                    // Relationship not found; navigate back to Case Relationships list
                                    this.router.navigate([`/cases/${this.caseId}/relationships`]);

                                    return ErrorObservable.create(err);
                                })
                                .subscribe((relationshipData) => {
                                    this.relationshipData = relationshipData;

                                    // get related entity
                                    const relatedEntityModel = _.get(relationshipData.relatedEntity(this.caseId), 'model', {});

                                    // add new breadcrumb: page title
                                    this.breadcrumbs.push(
                                        new BreadcrumbItemModel(
                                            'LNG_PAGE_MODIFY_CASE_RELATIONSHIP_TITLE',
                                            null,
                                            true,
                                            {},
                                            relatedEntityModel
                                        )
                                    );
                                });

                        });
                });
        });
    }

    modifyRelationship(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the case
        this.relationshipDataService
            .modifyRelationship(
                this.outbreakId,
                EntityType.CASE,
                this.caseId,
                this.relationshipId,
                dirtyFields
            )
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_RELATIONSHIP_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

                // navigate back to Case Relationships list
                this.router.navigate([`/cases/${this.caseId}/relationships`]);
            });
    }

}
