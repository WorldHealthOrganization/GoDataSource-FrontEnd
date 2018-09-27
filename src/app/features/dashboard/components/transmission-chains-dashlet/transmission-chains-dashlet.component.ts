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
import { forkJoin } from 'rxjs/observable/forkJoin';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Observable } from 'rxjs/Observable';

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
    genderList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    // reference data categories needed for filters
    referenceDataCategories: any = [
        ReferenceDataCategory.PERSON_TYPE,
        ReferenceDataCategory.GENDER,
        ReferenceDataCategory.CASE_CLASSIFICATION,
        ReferenceDataCategory.RISK_LEVEL,
        ReferenceDataCategory.CONTEXT_OF_TRANSMISSION,
        ReferenceDataCategory.CERTAINTY_LEVEL,
        ReferenceDataCategory.EXPOSURE_TYPE,
        ReferenceDataCategory.EXPOSURE_FREQUENCY,
        ReferenceDataCategory.EXPOSURE_DURATION
    ];
    // reference data entries per category
    referenceDataEntries: any = [];
    // reference data labels
    referenceDataLabelMap: any = {
        type: {label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL', refDataCateg: ReferenceDataCategory.PERSON_TYPE},
        gender: {label: 'LNG_CASE_FIELD_LABEL_GENDER', refDataCateg: ReferenceDataCategory.GENDER},
        classification: {label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION', refDataCateg: ReferenceDataCategory.CASE_CLASSIFICATION},
        riskLevel: {label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL', refDataCateg: ReferenceDataCategory.RISK_LEVEL},
        certaintyLevelId: {label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', refDataCateg: ReferenceDataCategory.CERTAINTY_LEVEL},
        socialRelationshipTypeId: {label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION', refDataCateg: ReferenceDataCategory.CONTEXT_OF_TRANSMISSION},
        exposureTypeId: {label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', refDataCateg: ReferenceDataCategory.EXPOSURE_TYPE},
        exposureFrequencyId: {label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', refDataCateg: ReferenceDataCategory.EXPOSURE_FREQUENCY},
        exposureDurationId: {label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', refDataCateg: ReferenceDataCategory.EXPOSURE_DURATION}
    };

    // default color criteria
    colorCriteria: any = {
        nodeColorCriteria: 'type',
        nodeNameColorCriteria: 'classification',
        edgeColorCriteria: 'certaintyLevelId'
    };
    // default legend
    legend: any = {
        nodeColorField: 'type',
        nodeNameColorField: 'classification',
        edgeColorField: 'certaintyLevelId',
        nodeColorLabel: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
        nodeNameColorLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        edgeColorLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        nodeColor: [],
        nodeNameColor: [],
        edgeColor: []
    };

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private relationshipDataService: RelationshipDataService
    ) {
    }

    ngOnInit() {
        // init filters - only show cases and events first
        this.filters.showContacts = false;
        this.filters.showEvents = true;

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);


        this.initializeReferenceData()
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                // display chain for default criteria
                //     this.displayChainsOfTransmission();

                this.outbreakDataService
                    .getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;
                        this.displayChainsOfTransmission();
                    });

            });
    }

    /**
     * Display chains of transmission
     */
    displayChainsOfTransmission() {
        this.mapColorCriteria();
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
                    this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(chains, this.filters, this.legend);
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

    /**
     *
     * @param colorCriteria
     */
    mapColorCriteria() {
        // set legend fields to be used
        this.legend.nodeColorField = this.colorCriteria.nodeColorCriteria;
        this.legend.nodeNameColorField = this.colorCriteria.nodeNameColorCriteria;
        this.legend.edgeColorField = this.colorCriteria.edgeColorCriteria;
        // set legend labels
        this.legend.nodeColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].label;
        this.legend.nodeNameColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].label;
        this.legend.edgeColorLabel = this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].label;
        // re-initialize legend entries
        this.legend.nodeColor = [];
        this.legend.nodeNameColor = [];
        this.legend.edgeColor = [];
        // set legend entries
        const nodeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeColorReferenceDataEntries, (value, key) => {
            this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        const nodeNameColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeNameColorReferenceDataEntries, (value, key) => {
            this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        const edgeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(edgeColorReferenceDataEntries, (value, key) => {
            this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
    }

    private initializeReferenceData() {
        // call observables in parallel
        const referenceDataCategories$ = _.map(
            this.referenceDataCategories,
            (refDataCategory) => {
                return this.referenceDataDataService.getReferenceDataByCategory(refDataCategory)
                    .do((results) => {
                        this.referenceDataEntries[refDataCategory] = results;
                    });
            }
        );
        return forkJoin(referenceDataCategories$);
    }

}


