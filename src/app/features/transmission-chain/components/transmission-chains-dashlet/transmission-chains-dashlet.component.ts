import * as _ from 'lodash';
import { Component, EventEmitter, Input, OnInit, ViewChild, Output, ViewEncapsulation, OnDestroy } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { IConvertChainToGraphElements, TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { Constants } from '../../../../core/models/constants';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { CytoscapeGraphComponent } from '../cytoscape-graph/cytoscape-graph.component';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { ActivatedRoute } from '@angular/router';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainFilters } from '../transmission-chains-filters/transmission-chains-filters.component';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-dashlet.component.html',
    styleUrls: ['./transmission-chains-dashlet.component.less']
})
export class TransmissionChainsDashletComponent implements OnInit, OnDestroy {

    @ViewChild(CytoscapeGraphComponent) cytoscapeChild;

    @Input() sizeOfChainsFilter: string = null;
    @Input() personId: string = null;
    @Input() selectedEntityType: EntityType = null;

    @Output() nodeTapped = new EventEmitter<GraphNodeModel>();
    @Output() edgeTapped = new EventEmitter<GraphEdgeModel>();
    @Output() changeEditMode = new EventEmitter<boolean>();

    selectedOutbreak: OutbreakModel;
    chainElements: TransmissionChainModel[];
    graphElements: IConvertChainToGraphElements;
    selectedViewType: string = Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value;
    Constants = Constants;
    showSettings: boolean = false;
    filters: any | TransmissionChainFilters = {};
    resetFiltersData: any;
    locationsList: LocationModel[];
    personName: string = '';
    dateGlobalFilter: string = moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

    nodeColorCriteriaOptions$: Observable<any[]>;
    nodeIconCriteriaOptions$: Observable<any[]>;
    nodeShapeCriteriaOptions$: Observable<any[]>;
    nodeLabelCriteriaOptions$: Observable<any[]>;
    edgeColorCriteriaOptions$: Observable<any[]>;
    edgeLabelCriteriaOptions$: Observable<any[]>;
    edgeIconCriteriaOptions$: Observable<any[]>;

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
        ReferenceDataCategory.EXPOSURE_DURATION,
        ReferenceDataCategory.OCCUPATION,
        ReferenceDataCategory.OUTCOME
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
        },
        occupation: {
            label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
            refDataCateg: ReferenceDataCategory.OCCUPATION
        },
        outcomeId: {
            label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
            refDataCateg: ReferenceDataCategory.OUTCOME
        }
    };

    // default color criteria
    resetColorCriteriaData: any;
    colorCriteria: any = {
        nodeLabelCriteria: Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.NAME.value,
        nodeColorCriteria: Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS.TYPE.value,
        nodeNameColorCriteria: Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS.CLASSIFICATION.value,
        edgeColorCriteria: Constants.TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS.CERTAINITY_LEVEL.value,
        edgeLabelCriteria: Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.NONE.value,
        edgeIconCriteria: Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.NONE.value,
        nodeIconCriteria: Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS.NONE.value,
        nodeShapeCriteria: Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.NONE.value
    };
    // default legend
    legend: any = {
        nodeColorField: 'type',
        nodeNameColorField: 'classification',
        edgeColorField: 'certaintyLevelId',
        nodeIconField: '',
        edgeIconField: '',
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

    // subscribers
    outbreakSubscriber: Subscription;

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
        private clusterDataService: ClusterDataService,
        protected route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        // init filters - only show cases and events first
        this.filters.showContacts = false;
        this.filters.showEvents = true;

        const locationQueryBuilder = new RequestQueryBuilder();
        locationQueryBuilder.fieldsInResponse = ['id', 'name'];
        this.locationDataService.getLocationsList(locationQueryBuilder).subscribe((results) => {
            this.locationsList = results;
        });

        this.nodeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeColorCriteriaOptions();
        this.edgeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeColorCriteriaOptions();
        this.edgeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeLabelCriteriaOptions();
        this.edgeIconCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeIconCriteriaOptions();
        this.nodeIconCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeIconCriteriaOptions();
        this.nodeShapeCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeShapeCriteriaOptions();
        this.nodeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeLabelCriteriaOptions();

        // check if we have global filters set
        this.route.queryParams.subscribe((queryParams: any) => {
            // do we need to decode global filters ?
            const global: {
                date?: Moment,
                locationId?: string,
                classificationId?: string[]
            } = !queryParams.global ?
                {} : (
                    _.isString(queryParams.global) ?
                        JSON.parse(queryParams.global as string) :
                        queryParams.global
                );

            // parse date
            if (global.date) {
                global.date = moment(global.date);
            }

            // date
            if (global.date) {
                this.dateGlobalFilter = global.date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
            }

            // location
            if (global.locationId) {
                this.filters.locationId = global.locationId;
            }

            // classification
            if (global.classificationId) {
                this.filters.classificationId = global.classificationId;
            }
        });

        this.initializeReferenceData()
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                // outbreak subscriber
                if (this.outbreakSubscriber) {
                    this.outbreakSubscriber.unsubscribe();
                    this.outbreakSubscriber = null;
                }

                this.outbreakSubscriber = this.outbreakDataService
                    .getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;

                        // when we have data
                        if (
                            this.selectedOutbreak &&
                            this.selectedOutbreak.id
                        ) {
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
                                .subscribe((clusters) => {
                                    this.legend.clustersList = [];
                                    _.forEach(clusters, (cluster) => {
                                        this.legend.clustersList[cluster.id] = cluster.name;
                                    });
                                });
                        }

                        // load chain
                        this.displayChainsOfTransmission();
                    });
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Display chains of transmission
     */
    displayChainsOfTransmission() {
        this.mapColorCriteria();
        if (this.selectedOutbreak) {
            // create queryBuilder for filters
            const requestQueryBuilder = new RequestQueryBuilder();
            requestQueryBuilder.filter.firstLevelConditions();

            // do we have chainIncludesPerson filters ?
            if (this.personId) {
                // include custom person builder that will handle these filters
                const chainIncludesPersonRequestQueryBuilder: RequestQueryBuilder = requestQueryBuilder.addChildQueryBuilder('chainIncludesPerson');
                chainIncludesPersonRequestQueryBuilder.filter.byEquality(
                    'id',
                    this.personId
                );
            }

            // add filter for size ( under where )
            if (this.sizeOfChainsFilter) {
                requestQueryBuilder.filter.byEquality(
                    'size',
                    _.parseInt(this.sizeOfChainsFilter)
                );
            }

            // global date - see state in time
            if (this.dateGlobalFilter) {
                requestQueryBuilder.filter.byEquality(
                    'endDate',
                    moment(this.dateGlobalFilter).toISOString()
                );
            }

            // add flags
            if (this.filters.showContacts) {
                requestQueryBuilder.filter.flag('includeContacts', 1);
            }

            // person query
            const personQuery = requestQueryBuilder.addChildQueryBuilder('person');

            // discarded cases
            // handled by API
            // NOTHING to do here

            // attach other filters ( locations & classifications & others... )
            if (!_.isEmpty(this.filters)) {
                // include custom person builder that will handle these filters
                const filterObject = new TransmissionChainFilters(this.filters);
                filterObject.attachConditionsToRequestQueryBuilder(personQuery);

                // attach classification conditions to parent qb as well ( besides personQuery )
                // isolated classification
                if (!_.isEmpty(filterObject.classificationId)) {
                    requestQueryBuilder.filter.where({
                        or: [
                            {
                                type: {
                                    neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                                }
                            }, {
                                type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                classification: {
                                    inq: filterObject.classificationId
                                }
                            }
                        ]
                    });
                }
            }

            // get chain data and convert to graph nodes
            this.transmissionChainDataService
                .getIndependentTransmissionChainData(this.selectedOutbreak.id, requestQueryBuilder)
                .subscribe((chains) => {
                    if (!_.isEmpty(chains)) {
                        this.chainElements = chains;
                        this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(chains, this.filters, this.legend, this.locationsList, this.selectedViewType);
                    } else {
                        this.chainElements = [];
                        this.graphElements = {} as IConvertChainToGraphElements;
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
        console.log(entity);
        this.nodeTapped.emit(entity);
    }

    /**
     * Handle tap on an edge
     * @param {GraphEdgeModel} relationship
     * @returns {IterableIterator<any>}
     */
    onEdgeTap(relationship: GraphEdgeModel) {
        console.log(relationship);
        this.edgeTapped.emit(relationship);
    }

    /**
     * display / hide the settings section
     */
    toggleSettings() {
        this.showSettings = !this.showSettings;

        // get default filters
        setTimeout(() => {
            if (
                this.showSettings &&
                !this.resetFiltersData
            ) {
                this.resetFiltersData = _.cloneDeep(this.filters);
                this.resetColorCriteriaData = _.cloneDeep(this.colorCriteria);
            }
        });
    }

    /**
     * refresh chain data based on filters
     */
    refreshChain() {
        // refresh chart
        this.displayChainsOfTransmission();

        // close settings panel
        this.showSettings = false;
    }

    /**
     * reset filters
     */
    resetFilters() {
        // reset settings
        this.filters = _.cloneDeep(this.resetFiltersData);
        this.colorCriteria = _.cloneDeep(this.resetColorCriteriaData);

        // close settings panel
        setTimeout(() => {
            this.refreshChain();
        });
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
        this.legend.edgeIconField = this.colorCriteria.edgeIconCriteria;
        if (this.legend.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value) {
            this.legend.edgeLabelContextTransmissionEntries = {};
            const refDataEntries = this.referenceDataEntries[this.referenceDataLabelMap[Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value].refDataCateg];
            _.forEach(refDataEntries.entries, (entry) => {
                this.legend.edgeLabelContextTransmissionEntries[entry.value] = this.i18nService.instant(entry.value);
            });
        }
        this.legend.nodeIconField = this.colorCriteria.nodeIconCriteria;
        this.legend.nodeShapeField = this.colorCriteria.nodeShapeCriteria;
        // set legend labels
        this.legend.nodeColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].label;
        this.legend.nodeNameColorLabel = this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].label;
        this.legend.edgeColorLabel = this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].label;
        this.legend.edgeIconLabel = (this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria]) ? this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria].label : '';
        this.legend.nodeIconLabel = (this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria]) ? this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria].label : '';
        this.legend.nodeShapeLabel = (this.referenceDataLabelMap[this.colorCriteria.nodeShapeCriteria]) ? this.referenceDataLabelMap[this.colorCriteria.nodeShapeCriteria].label : '';
        // re-initialize legend entries
        this.legend.nodeColor = {};
        this.legend.nodeColorKeys = [];
        this.legend.nodeNameColor = {};
        this.legend.nodeNameColorKeys = [];
        this.legend.edgeColor = {};
        this.legend.edgeColorKeys = [];
        this.legend.edgeIcon = {};
        this.legend.edgeIconKeys = [];
        this.legend.nodeIcon = {};
        this.legend.nodeIconKeys = [];
        this.legend.nodeShape = {};
        this.legend.nodeShapeKeys = [];
        // set legend entries
        const nodeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeColorReferenceDataEntries, (value) => {
            this.legend.nodeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.nodeColorKeys = Object.keys(this.legend.nodeColor);
        const nodeNameColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeNameColorCriteria].refDataCateg], 'entries', []);
        _.forEach(nodeNameColorReferenceDataEntries, (value) => {
            this.legend.nodeNameColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.nodeNameColorKeys = Object.keys(this.legend.nodeNameColor);
        const edgeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].refDataCateg], 'entries', []);
        _.forEach(edgeColorReferenceDataEntries, (value) => {
            this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
        });
        this.legend.edgeColorKeys = Object.keys(this.legend.edgeColor);
        if (this.colorCriteria.edgeIconCriteria !== Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.NONE.value) {
            const edgeIconReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria].refDataCateg], 'entries', []);
            // get edge icons based on the selected criteria
            let getEdgeIconFunc: (criteriaKey: any) => string;
            if (this.colorCriteria.edgeIconCriteria === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value) {
                getEdgeIconFunc = GraphEdgeModel.getEdgeIconContextOfTransmission;
            } else if (this.colorCriteria.edgeIconCriteria === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.EXPOSURE_TYPE.value) {
                getEdgeIconFunc = GraphEdgeModel.getEdgeIconExposureType;
            }
            _.forEach(edgeIconReferenceDataEntries, (value) => {
                this.legend.edgeIcon[value.value] = getEdgeIconFunc(value.value);
            });
            this.legend.edgeIconKeys = Object.keys(this.legend.edgeIcon);
        }
        if (this.colorCriteria.nodeIconCriteria !== Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS.NONE.value) {
            const nodeIconReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeIconCriteria].refDataCateg], 'entries', []);
            _.forEach(nodeIconReferenceDataEntries, (value) => {
                this.legend.nodeIcon[value.value] = value.iconUrl ? value.iconUrl : '';
            });
            this.legend.nodeIconKeys = Object.keys(this.legend.nodeIcon);
        }
        if (this.colorCriteria.nodeShapeCriteria !== Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.NONE.value) {
            const nodeShapeReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.nodeShapeCriteria].refDataCateg], 'entries', []);
            // get node shapes based on the selected criteria
            let getNodeShapeFunc: (criteriaKey: any) => string;
            if (this.colorCriteria.nodeShapeCriteria === Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.TYPE.value) {
                getNodeShapeFunc = GraphNodeModel.getNodeShapeType;
            } else if (this.colorCriteria.nodeShapeCriteria === Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.CLASSIFICATION.value) {
                getNodeShapeFunc = GraphNodeModel.getNodeShapeClassification;
            }
            _.forEach(nodeShapeReferenceDataEntries, (value) => {
                this.legend.nodeShape[value.value] = `${getNodeShapeFunc(value.value)}_shape`;
            });
            this.legend.nodeShapeKeys = Object.keys(this.legend.nodeShape);
        }
        // set node label to be displayed
        this.legend.nodeLabel = this.colorCriteria.nodeLabelCriteria;
        // gender translations
        if (this.legend.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
            this.legend.nodeLabelValues = [];
            const nodeLabelValues = _.get(this.referenceDataEntries[ReferenceDataCategory.GENDER], 'entries', []);
            _.forEach(nodeLabelValues, (value) => {
                // get gender transcriptions
                this.legend.nodeLabelValues[value.value] = this.i18nService.instant(value.value);
            });
        }
        // occupation translations
        if (this.legend.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.OCCUPATION.value) {
            this.legend.nodeLabelValues = [];
            const nodeLabelValues = _.get(this.referenceDataEntries[ReferenceDataCategory.OCCUPATION], 'entries', []);
            _.forEach(nodeLabelValues, (value) => {
                // get gender transcriptions
                this.legend.nodeLabelValues[value.value] = this.i18nService.instant(value.value);
            });
        }
        // populate nodeLabelValues with gender / classification / outcome values as they need to be translated
        if (this.legend.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.CONCATENATED_DETAILS.value) {
            this.legend.genderValues = [];
            const genderValues = _.get(this.referenceDataEntries[ReferenceDataCategory.GENDER], 'entries', []);
            _.forEach(genderValues, (value) => {
                // get gender transcriptions
                this.legend.genderValues[value.value] = this.i18nService.instant(value.value);
            });

            this.legend.classificationValues = [];
            const classificationValues = _.get(this.referenceDataEntries[ReferenceDataCategory.CASE_CLASSIFICATION], 'entries', []);
            _.forEach(classificationValues, (value) => {
                // get classification transcriptions
                this.legend.classificationValues[value.value] = this.i18nService.instant(value.value);
            });

            this.legend.outcomeValues = [];
            const outcomeValues = _.get(this.referenceDataEntries[ReferenceDataCategory.OUTCOME], 'entries', []);
            _.forEach(outcomeValues, (value) => {
                // get outcome values transcriptions
                this.legend.outcomeValues[value.value] = this.i18nService.instant(value.value);
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
                    .pipe(
                        tap((results) => {
                            this.referenceDataEntries[refDataCategory] = results;
                        })
                    );
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
        // refresh chain to load the new criteria
        this.displayChainsOfTransmission();
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

    onEditModeChange(editMode: boolean) {
        this.changeEditMode.emit(editMode);
    }

    /**
     * return the png representation of the graph
     * @param {number} splitFactor
     * @returns {any}
     */
    getPng64(splitFactor: number) {
        return this.cytoscapeChild.getPng64(splitFactor);
    }

    /**
     * Only allow to show edge icon or edge label: switch between them
     * @param field
     * @param $event
     */
    changeEdgeLabelIconSelection(field, $event) {
        if (field === 'label' && $event !== Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.NONE.value) {
            this.colorCriteria.edgeIconCriteria = Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.NONE.value;
        } else if (field === 'icon' && $event !== Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.NONE.value) {
            this.colorCriteria.edgeLabelCriteria = Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.NONE.value;
        }
    }
}


