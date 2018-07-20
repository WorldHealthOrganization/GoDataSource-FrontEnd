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
    selector: 'app-create-case-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case-relationship.component.html',
    styleUrls: ['./create-case-relationship.component.less']
})
export class CreateCaseRelationshipComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    // selected outbreak ID
    outbreakId: string;
    // route param
    caseId: string;

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
                            // add new breadcrumb: page title
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_RELATIONSHIP_TITLE', '.', true)
                            );
                        });
                });
        });
    }

    /**
     * Refresh te list of persons based on the selected relationship type
     */
    refreshPersonsList() {
        if (!this.outbreakId) {
            return;
        }

        this.relatedEntityId = null;

        switch (this.relatedEntityType) {
            case EntityType.CASE:
                // exclude current Case from the list
                const casesQueryBuilder = new RequestQueryBuilder();
                casesQueryBuilder.merge(this.personsQueryBuilder);
                casesQueryBuilder.filter.where({
                    id: {
                        'neq': this.caseId
                    }
                });

                this.personsList$ = this.caseDataService.getCasesList(this.outbreakId, casesQueryBuilder);
                break;

            case EntityType.CONTACT:
                this.personsList$ = this.contactDataService.getContactsList(this.outbreakId, this.personsQueryBuilder);
                break;

            case EntityType.EVENT:
                this.personsList$ = this.eventDataService.getEventsList(this.outbreakId, this.personsQueryBuilder);
                break;
        }
    }

    createNewRelationship(stepForms: NgForm[]) {

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // remove unnecessary fields
        delete dirtyFields.relatedEntityType;

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // add the new Case
                    this.relationshipDataService
                        .createRelationship(
                            this.outbreakId,
                            EntityType.CASE,
                            this.caseId,
                            dirtyFields
                        )
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_CASE_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');

                            // navigate to listing page
                            this.router.navigate([`/cases/${this.caseId}/relationships`]);
                        });
                });
        }
    }

}
