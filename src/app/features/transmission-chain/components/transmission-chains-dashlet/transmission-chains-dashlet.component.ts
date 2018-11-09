import * as _ from 'lodash';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
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
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import * as moment from 'moment';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';

@Component({
    selector: 'app-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-dashlet.component.html',
    styleUrls: ['./transmission-chains-dashlet.component.less']
})
export class TransmissionChainsDashletComponent implements OnInit {

    @Input() sizeOfChainsFilter: number = null;
    @Input() personId: string = null;
    @Input() selectedEntityType: EntityType = null;
    selectedOutbreak: OutbreakModel;
    graphElements: any;
    selectedViewType: string = Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value;
    Constants = Constants;
    showSettings: boolean = false;
    filters: any = {};
    genderList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    locationsList: LocationModel[];
    personName: string = '';
    dateGlobalFilter: string = moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

    nodeColorCriteriaOptions$: Observable<any[]>;
    nodeIconCriteriaOptions$: Observable<any[]>;
    nodeLabelCriteriaOptions$: Observable<any[]>;
    edgeColorCriteriaOptions$: Observable<any[]>;
    edgeLabelCriteriaOptions$: Observable<any[]>;

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
    // reference data labels and categories
    referenceDataLabelMap: any = {
        type: {
            label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
            refDataCateg: ReferenceDataCategory.PERSON_TYPE
        },
        gender: {
            label: 'LNG_CASE_FIELD_LABEL_GENDER',
            refDataCateg: ReferenceDataCategory.GENDER
        },
        classification: {
            label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            refDataCateg: ReferenceDataCategory.CASE_CLASSIFICATION
        },
        riskLevel: {
            label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            refDataCateg: ReferenceDataCategory.RISK_LEVEL
        },
        certaintyLevelId: {
            label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
            refDataCateg: ReferenceDataCategory.CERTAINTY_LEVEL
        },
        socialRelationshipTypeId: {
            label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
            refDataCateg: ReferenceDataCategory.CONTEXT_OF_TRANSMISSION
        },
        exposureTypeId: {
            label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
            refDataCateg: ReferenceDataCategory.EXPOSURE_TYPE
        },
        exposureFrequencyId: {
            label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
            refDataCateg: ReferenceDataCategory.EXPOSURE_FREQUENCY
        },
        exposureDurationId: {
            label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
            refDataCateg: ReferenceDataCategory.EXPOSURE_DURATION
        }
    };

    // default color criteria
    colorCriteria: any = {
        nodeLabelCriteria: Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.NAME.value,
        nodeColorCriteria: Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS.TYPE.value,
        nodeNameColorCriteria: Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS.CLASSIFICATION.value,
        edgeColorCriteria: Constants.TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS.CERTAINITY_LEVEL.value,
        edgeLabelCriteria: Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.NONE.value,
        nodeIconCriteria: Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS.NONE.value
    };
    // default legend
    legend: any = {
        nodeColorField: 'type',
        nodeNameColorField: 'classification',
        edgeColorField: 'certaintyLevelId',
        nodeIconField: '',
        nodeColorLabel: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
        nodeNameColorLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        edgeColorLabel: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        nodeIconLabel: '',
        nodeColor: {},
        nodeNameColor: {},
        nodeIcon: {},
        nodeNameColorAdditionalInfo: {
            'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE': 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
            'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT': 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT': 'LNG_EVENT_FIELD_LABEL_DATE'
        },
        edgeColor: {},
        nodeLabel: 'name'
    };

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private relationshipDataService: RelationshipDataService,
        private i18nService: I18nService,
        private locationDataService: LocationDataService,
        private clusterDataService: ClusterDataService
    ) {}

    ngOnInit() {
        // init filters - only show cases and events first
        this.filters.showContacts = false;
        this.filters.showEvents = true;

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        const locationQueryBuilder = new RequestQueryBuilder();
        locationQueryBuilder.fieldsInResponse = ['id', 'name'];
        this.locationDataService.getLocationsList(locationQueryBuilder).subscribe((results) => {
            this.locationsList = results;
        });

        this.nodeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeColorCriteriaOptions();
        this.edgeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeColorCriteriaOptions();
        this.edgeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeLabelCriteriaOptions();
        this.nodeIconCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeIconCriteriaOptions();
        this.nodeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeLabelCriteriaOptions();

        this.initializeReferenceData()
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.outbreakDataService
                    .getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;
                        // load person if selected
                        if (this.personId) {
                            this.entityDataService
                                .getEntity(this.selectedEntityType, this.selectedOutbreak.id, this.personId)
                                .subscribe((entity) => {
                                    this.personName = entity.name;
                                });
                        }
                        // load clusters list
                        this.clusterDataService
                            .getClusterList(this.selectedOutbreak.id)
                            .subscribe( (clusters) => {
                                this.legend.clustersList = [];
                                _.forEach(clusters, (cluster) => {
                                    this.legend.clustersList[cluster.id] = cluster.name;
                                });
                            });
                        // load chain
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
            // create queryBuilder for filters
            const requestQueryBuilder = new RequestQueryBuilder();
            if (this.filters) {
                // occupation
                if (!_.isEmpty(this.filters.occupation)) {
                    requestQueryBuilder.filter.byEquality(
                        'occupation',
                        this.filters.occupation
                    );
                }

                // gender
                if (!_.isEmpty(this.filters.gender)) {
                    requestQueryBuilder.filter.bySelect(
                        'gender',
                        this.filters.gender,
                        true,
                        null
                    );
                }

                // case classification
                if (!_.isEmpty(this.filters.classification)) {
                    requestQueryBuilder.filter.byEquality(
                        'classification',
                        this.filters.classification
                    );
                }

                // case location
                if (!_.isEmpty(this.filters.locationId)) {
                    requestQueryBuilder.filter.byEquality(
                        'addresses.locationId',
                        this.filters.locationId
                    );
                }

                // firstName
                if (!_.isEmpty(this.filters.firstName)) {
                    requestQueryBuilder.filter.byText(
                        'firstName',
                        this.filters.firstName
                    );
                }

                // lastName
                if (!_.isEmpty(this.filters.lastName)) {
                    requestQueryBuilder.filter.byText(
                        'lastName',
                        this.filters.lastName
                    );
                }

                // age
                if (!_.isEmpty(this.filters.age)) {
                    requestQueryBuilder.filter.byAgeRange(
                        'age',
                        this.filters.age
                    );
                }

                // date of reporting
                if (!_.isEmpty(this.filters.date)) {
                    requestQueryBuilder.filter.byDateRange(
                        'dateOfReporting',
                        this.filters.date
                    );
                }
            }

            // configure
            const rQB = new RequestQueryBuilder();

            if (!requestQueryBuilder.filter.isEmpty()) {
                rQB.filter.where({
                    person: {
                        where: requestQueryBuilder.filter.generateCondition()
                    }
                });
            }

            // get chain data and convert to graph nodes
            this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id, this.sizeOfChainsFilter, this.personId, rQB, this.dateGlobalFilter).subscribe((chains) => {
                if (!_.isEmpty(chains)) {
                    this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(chains, this.filters, this.legend, this.locationsList);
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
     * return mapping between criteria and colors to use
     * @param colorCriteria
     */
    mapColorCriteria() {
        // set legend fields to be used
        this.legend.nodeColorField = this.colorCriteria.nodeColorCriteria;
        this.legend.nodeNameColorField = this.colorCriteria.nodeNameColorCriteria;
        this.legend.edgeColorField = this.colorCriteria.edgeColorCriteria;
        this.legend.edgeLabelField = this.colorCriteria.edgeLabelCriteria;
        if (this.legend.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value ) {
            this.legend.edgeLabelContextTransmissionEntries = {};
            const refDataEntries = this.referenceDataEntries[this.referenceDataLabelMap[Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value].refDataCateg];
            _.forEach(refDataEntries.entries, (entry) => {
               this.legend.edgeLabelContextTransmissionEntries[entry.value] = this.i18nService.instant(entry.value);
            });
        }
        this.legend.nodeIconField = this.colorCriteria.nodeIconCriteria;
        // set legend labels
        this.legend.nodeColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].label;
        this.legend.nodeNameColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].label;
        this.legend.edgeColorLabel = this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].label;
        this.legend.nodeIconLabel = (this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria]) ? this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria].label : '';
        // re-initialize legend entries
        this.legend.nodeColor = {};
        this.legend.nodeColorKeys = [];
        this.legend.nodeNameColor = {};
        this.legend.nodeNameColorKeys = [];
        this.legend.edgeColor = {};
        this.legend.edgeColorKeys = [];
        this.legend.nodeIcon = {};
        this.legend.nodeIconKeys = [];
        // set legend entries
        const nodeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeColorReferenceDataEntries, (value, key) => {
            this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.nodeColorKeys = Object.keys(this.legend.nodeColor);
        const nodeNameColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeNameColorReferenceDataEntries, (value, key) => {
            this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.nodeNameColorKeys = Object.keys(this.legend.nodeNameColor);
        const edgeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(edgeColorReferenceDataEntries, (value, key) => {
            this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.edgeColorKeys = Object.keys(this.legend.edgeColor);
        if (this.colorCriteria.nodeIconCriteria !== Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS.NONE.value) {
            const nodeIconReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria].refDataCateg], 'entries', []);
            _.forEach(nodeIconReferenceDataEntries, (value, key) => {
                this.legend.nodeIcon[value.value] = value.iconUrl ? value.iconUrl : '';
            });
            this.legend.nodeIconKeys = Object.keys(this.legend.nodeIcon);
        }
        // set node label to be displayed
        this.legend.nodeLabel = this.colorCriteria.nodeLabelCriteria;
        if (this.legend.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
            this.legend.nodeLabelValues = [];
            const nodeLabelValues = _.get(this.referenceDataEntries[ReferenceDataCategory.GENDER], 'entries', []);
            _.forEach(nodeLabelValues, (value, key) => {
                // get gender transcriptions
                this.legend.nodeLabelValues[value.value] = this.i18nService.instant(value.value);
            });
        }

    }

    /**
     * initialize reference data objects with the needed entities
     * @returns {Observable<any[]>}
     */
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

    /**
     * triggered when the view type is changed
     * @param viewType
     */
    viewTypeChanged(viewType) {
        this.selectedViewType = viewType.value;
        if (this.selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value) {
            // if node label criteria is already 'type' then do not reload the graph data.
            if (this.colorCriteria.nodeNameColorCriteria !== 'type') {
                this.colorCriteria.nodeNameColorCriteria = 'type';
                // refresh chain to load the new criteria
                this.displayChainsOfTransmission();
            }
        }
    }

    /**
     * return the tooltip for criteria based on the selected view type
     * @returns {string}
     */
    tooltipViewTimeline() {
        return (this.selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                ? 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_COLOR_CRITERIA_TIMELINE_VIEW_TOOLTIP'
                : null
        );
    }

    /**
     * reset chain - navigate to chains of transmission not filtered
     */
    resetChain() {
        this.sizeOfChainsFilter = null;
        this.personId = null;
        this.refreshChain();
    }

    /**
     * Reload COT when global date changes
     */
    onChangeGlobalDate() {
        this.displayChainsOfTransmission();
    }

}


