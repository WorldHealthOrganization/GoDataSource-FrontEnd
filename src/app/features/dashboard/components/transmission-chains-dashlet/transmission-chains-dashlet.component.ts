import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { Constants } from '../../../../core/models/constants';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-dashlet.component.html',
    styleUrls: ['./transmission-chains-dashlet.component.less']
})
export class TransmissionChainsDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    graphElements: any;
    Constants = Constants;
    showSettings: boolean = false;
    filters: any = {};
    caseClassificationsList$: Observable<any[]>;
    genderList$: Observable<any[]>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private relationshipDataService: RelationshipDataService
    ) {}

    ngOnInit() {
        // init filters - only show cases and events first
        this.filters.showContacts = false;
        this.filters.showEvents = true;

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                this.displayChainsOfTransmission();
            });
    }

    /**
     * Display chains of transmission
     */
    displayChainsOfTransmission() {
        if (this.selectedOutbreak) {
            const requestQueryBuilder = new RequestQueryBuilder();
            // create queryBuilder for filters
            if (this.filters) {
                const conditions: any = {};
                // create conditions based on filters
                // occupation
                if (!_.isEmpty(this.filters.occupation)) {
                    conditions['occupation'] = {regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.occupation) + '/i'};
                }
                // gender
                if (!_.isEmpty(this.filters.gender)) {
                    conditions['gender'] = {inq: this.filters.gender};
                }
                // case classification
                if (!_.isEmpty(this.filters.classification)) {
                    conditions['classification'] = this.filters.classification;
                }
                // case classification
                if (!_.isEmpty(this.filters.locationId)) {
                    conditions['addresses.locationId'] = this.filters.locationId;
                }
                // firstName
                if (!_.isEmpty(this.filters.firstName)) {
                    conditions['firstName'] = {regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.firstName) + '/i'};
                }
                // lastName
                if (!_.isEmpty(this.filters.lastName)) {
                    conditions['lastName'] = {regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.lastName) + '/i'};
                }
                // age
                if (!_.isEmpty(this.filters.age)) {
                    if (this.filters.age.from && this.filters.age.to) {
                        conditions['age'] = {between: [this.filters.age.from, this.filters.age.to]};
                    } else if (this.filters.age.from) {
                        conditions['age'] = {gt: this.filters.age.from};
                    } else {
                        conditions['age'] = {lt: this.filters.age.to};
                    }
                }
                // date of reporting
                if (!_.isEmpty(this.filters.date)) {
                    if (!_.isEmpty(this.filters.date.startDate) && !_.isEmpty(this.filters.date.endDate)) {
                        conditions['dateOfReporting'] = {between: [this.filters.date.startDate, this.filters.date.endDate]};
                    } else if (!_.isEmpty(this.filters.date.startDate)) {
                        conditions['dateOfReporting'] = {gt: this.filters.date.startDate};
                    } else {
                        conditions['dateOfReporting'] = {lt: this.filters.date.endDate};
                    }
                }

                requestQueryBuilder.filter.where({
                    person: {
                        where: conditions
                    }
                });
            }

            this.filters.filtersDefault = this.filtersDefault();
            // get chain data and convert to graph nodes
            this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id, requestQueryBuilder).subscribe((chains) => {
                if (!_.isEmpty(chains)) {
                    this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(chains, this.filters);
                } else {
                    this.graphElements = [];
                }
            });
        }
    }

    /**
     * Handle tap on a node
     * @param {GraphNodeModel} entity
     * @returns {IterableIterator<any>}
     */
    onNodeTap(entity: GraphNodeModel) {
        // retrieve Case/Event/Contact information
        this.entityDataService
            .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
            .catch((err) => {
                // show error message
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((entityData: CaseModel | EventModel | ContactModel) => {
                // show dialog with data
                const dialogData = this.entityDataService.getLightObjectDisplay(entityData);
                this.dialogService.showDataDialog(dialogData);
            });
    }

    /**
     * Handle tap on an edge
     * @param {GraphEdgeModel} relationship
     * @returns {IterableIterator<any>}
     */
    onEdgeTap(relationship: GraphEdgeModel) {
        // retrieve relationship information
        // get relationship data
        this.relationshipDataService
            .getEntityRelationship(this.selectedOutbreak.id, relationship.sourceType, relationship.source, relationship.id)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((relationshipData) => {
                relationshipData.sourceType = relationship.sourceType;
                relationshipData.source = relationship.source;
                const dialogData = this.relationshipDataService.getLightObjectDisplay(relationshipData);
                this.dialogService.showDataDialog(dialogData);
            });
    }

    /**
     * display / hide the settings section
     */
    toggleSettings() {
        this.showSettings = !this.showSettings;
    }

    /**
     * refresh chain data based on filters
     */
    refreshChain() {
        this.displayChainsOfTransmission();
        // close settings panel
        this.showSettings = false;
    }

    /**
     * used to determine if filters are used. If not, we can load the graph faster
     * @returns {boolean}
     */
    filtersDefault(): boolean {
        return (
            this.filters.showEvents
            && !this.filters.showContacts
            && _.isEmpty(this.filters.classification)
            && _.isEmpty(this.filters.gender)
            && _.isEmpty(this.filters.occupation)
            && _.isEmpty(this.filters.firstName)
            && _.isEmpty(this.filters.lastName)
            && _.isEmpty(this.filters.date)
            && _.isEmpty(this.filters.locationId)
            && _.isEmpty(this.filters.age)
            );
    }

    /**
     * set age filter at range update
     * @param ageRange
     */
    setAgeFilter(ageRange) {
        this.filters.age = ageRange;
    }

    /**
     * set age filter at range update
     * @param dateRange
     */
    setDateFilter(dateRange) {
        this.filters.date = dateRange;
    }

}


