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
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';

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
    caseClassificationRefData: ReferenceDataCategoryModel;
    genderList$: Observable<any[]>;
    genderRefData: ReferenceDataCategoryModel;
    riskLevelRefData: ReferenceDataCategoryModel;
    relationRefData: ReferenceDataCategoryModel;
    certainityLevelRefData: ReferenceDataCategoryModel;
    exposureTypeRefData: ReferenceDataCategoryModel;
    exposureFrequencyRefData: ReferenceDataCategoryModel;
    exposureDurationRefData: ReferenceDataCategoryModel;
    personTypeRefData: ReferenceDataCategoryModel;
    colorCriteria: any = {
        nodeColorCriteria: 'type',
        nodeNameColorCriteria: 'classification',
        edgeColorCriteria: 'certaintyLevelId'
    };
    legend: any = {
        nodeColorField: 'type',
        nodeNameColorField: 'classification',
        edgeColorField: 'certaintyLevelId',
        nodeColorLabel: 'LNG_ENTITY_TYPE_LABEL',
        nodeNameColorLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        edgeColorLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        nodeColor : [],
        nodeNameColor: [],
        edgeColor: []
    };
    defaultColor = '#A8A8A8';

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

        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION).subscribe((results) => {
            this.caseClassificationRefData = results;
            // call display chains for default criteria
            this.displayChainsOfTransmission();
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).subscribe((results) => {
            this.personTypeRefData = results;
            // call display chains for default criteria
            this.displayChainsOfTransmission();
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.GENDER).subscribe((results) => {
            this.genderRefData = results;
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.RISK_LEVEL).subscribe((results) => {
            this.riskLevelRefData = results;
            // call display chains for default criteria
            this.displayChainsOfTransmission();
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION).subscribe((results) => {
            this.relationRefData = results;
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CERTAINTY_LEVEL).subscribe((results) => {
            this.certainityLevelRefData = results;
            this.displayChainsOfTransmission();
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.EXPOSURE_TYPE).subscribe((results) => {
            this.exposureTypeRefData = results;
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.EXPOSURE_FREQUENCY).subscribe((results) => {
            this.exposureFrequencyRefData = results;
        });
        this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.EXPOSURE_DURATION).subscribe((results) => {
            this.exposureDurationRefData = results;
        });

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
        // node color
        this.legend.nodeColorField = this.colorCriteria.nodeColorCriteria;
        this.legend.nodeNameColorField = this.colorCriteria.nodeNameColorCriteria;
        this.legend.edgeColorField = this.colorCriteria.edgeColorCriteria;
        this.legend.nodeColor = [];
        this.legend.nodeNameColor = [];
        this.legend.edgeColor = [];
        switch (this.colorCriteria.nodeColorCriteria) {
            case 'type':
                this.legend.nodeColorLabel = 'LNG_ENTITY_TYPE_LABEL';
                this.legend.nodeColor[EntityType.CASE] = '#e80b0b';
                this.legend.nodeColor[EntityType.CONTACT] = '#4DB0A0';
                this.legend.nodeColor[EntityType.EVENT] = '#f96b00';
                // TODO: decide if we use the reference data field as Person Type or hardcode these.
                // if (this.personTypeRefData && !_.isEmpty(this.personTypeRefData.entries)) {
                //     _.forEach(this.personTypeRefData.entries, (value, key) => {
                //         this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                //     });
                // }
                break;
            case 'classification':
                this.legend.nodeColorLabel = 'LNG_CASE_FIELD_LABEL_CLASSIFICATION';
                if (this.caseClassificationRefData && !_.isEmpty(this.caseClassificationRefData.entries)) {
                    _.forEach(this.caseClassificationRefData.entries, (value, key) => {
                        this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'riskLevel':
                this.legend.nodeColorLabel = 'LNG_CASE_FIELD_LABEL_RISK_LEVEL';
                if (this.riskLevelRefData && !_.isEmpty(this.riskLevelRefData.entries)) {
                    _.forEach(this.riskLevelRefData.entries, (value, key) => {
                        this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'gender':
                this.legend.nodeColorLabel = 'LNG_CASE_FIELD_LABEL_GENDER';
                if (this.genderRefData && !_.isEmpty(this.genderRefData.entries)) {
                    _.forEach(this.genderRefData.entries, (value, key) => {
                        this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            default:
                this.legend.nodeColor = [];
        }

        // node name color
        switch (this.colorCriteria.nodeNameColorCriteria) {
            case 'type':
                this.legend.nodeNameColorLabel = 'LNG_ENTITY_TYPE_LABEL';
                if (this.personTypeRefData && !_.isEmpty(this.personTypeRefData.entries)) {
                    _.forEach(this.personTypeRefData.entries, (value, key) => {
                        this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'classification':
                this.legend.nodeNameColorLabel = 'LNG_CASE_FIELD_LABEL_CLASSIFICATION';
                if (this.caseClassificationRefData && !_.isEmpty(this.caseClassificationRefData.entries)) {
                    _.forEach(this.caseClassificationRefData.entries, (value, key) => {
                        this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'riskLevel':
                this.legend.nodeNameColorLabel = 'LNG_CASE_FIELD_LABEL_RISK_LEVEL';
                if (this.riskLevelRefData && !_.isEmpty(this.riskLevelRefData.entries)) {
                    _.forEach(this.riskLevelRefData.entries, (value, key) => {
                        this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'gender':
                this.legend.nodeNameColorLabel = 'LNG_CASE_FIELD_LABEL_GENDER';
                if (this.genderRefData && !_.isEmpty(this.genderRefData.entries)) {
                    _.forEach(this.genderRefData.entries, (value, key) => {
                        this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            default:
                this.legend.nodeNameColor = [];
        }

        // edge color
        switch (this.colorCriteria.edgeColorCriteria) {
            case 'socialRelationshipTypeId':
                this.legend.edgeColorLabel = 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION';
                if (this.relationRefData && !_.isEmpty(this.relationRefData.entries)) {
                    _.forEach(this.relationRefData.entries, (value, key) => {
                        this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'certaintyLevelId':
                this.legend.edgeColorLabel = 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL';
                if (this.certainityLevelRefData && !_.isEmpty(this.certainityLevelRefData.entries)) {
                    _.forEach(this.certainityLevelRefData.entries, (value, key) => {
                        this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'exposureTypeId':
                this.legend.edgeColorLabel = 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE';
                if (this.exposureTypeRefData && !_.isEmpty(this.exposureTypeRefData.entries)) {
                    _.forEach(this.exposureTypeRefData.entries, (value, key) => {
                        this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'exposureFrequencyId':
                this.legend.edgeColorLabel = 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY';
                if (this.exposureFrequencyRefData && !_.isEmpty(this.exposureFrequencyRefData.entries)) {
                    _.forEach(this.exposureFrequencyRefData.entries, (value, key) => {
                        this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            case 'exposureDurationId':
                this.legend.edgeColorLabel = 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION';
                if (this.exposureDurationRefData && !_.isEmpty(this.exposureDurationRefData.entries)) {
                    _.forEach(this.exposureDurationRefData.entries, (value, key) => {
                        this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : this.defaultColor;
                    });
                }
                break;
            default:
                this.legend.edgeColor = [];
        }

    }

}


