import * as _ from 'lodash';
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { IConvertChainToGraphElements, TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { Constants } from '../../../../core/models/constants';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { ActivatedRoute } from '@angular/router';
import { ITransmissionChainGroupPageModel, TransmissionChainGroupModel, TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainFilters } from '../transmission-chains-filters/transmission-chains-filters.component';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { WorldMapMarker, WorldMapPath, WorldMapMarkerLayer, WorldMapPoint, WorldMapMarkerType, WorldMapComponent, WorldMapPathType } from '../../../../common-modules/world-map/components/world-map/world-map.component';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import * as cytoscape from 'cytoscape';
import * as cola from 'cytoscape-cola';
import * as dagre from 'cytoscape-dagre';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { LoadingDialogModel, ViewCotEdgeDialogComponent, ViewCotNodeDialogComponent } from '../../../../shared/components';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ClusterModel } from '../../../../core/models/cluster.model';

@Component({
    selector: 'app-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-dashlet.component.html',
    styleUrls: ['./transmission-chains-dashlet.component.less']
})
export class TransmissionChainsDashletComponent implements OnInit, OnDestroy {
    static wheelSensitivity: number = 0.3;

    @Input() sizeOfChainsFilter: string = null;
    @Input() personId: string = null;
    @Input() selectedEntityType: EntityType = null;

    @Output() nodeTapped = new EventEmitter<GraphNodeModel>();
    @Output() edgeTapped = new EventEmitter<GraphEdgeModel>();
    @Output() changeEditMode = new EventEmitter<boolean>();

    @ViewChild('cyItem') cyRef: ElementRef;

    // constants
    Constants = Constants;
    WorldMapMarkerLayer = WorldMapMarkerLayer;
    ClusterModel = ClusterModel;

    // chain pages
    chainPageSize: number;
    chainPages: ITransmissionChainGroupPageModel[];
    selectedChainPageIndex: number = 0;

    // page size
    pageSize: number = 500;

    selectedOutbreak: OutbreakModel;
    chainGroupId: string;
    chainGroup: TransmissionChainGroupModel;
    graphElements: IConvertChainToGraphElements;
    showFilters: boolean = false;
    showGraphConfiguration: boolean = false;
    filters: TransmissionChainFilters = new TransmissionChainFilters();
    locationsListMap: {
        [idLocation: string]: LocationModel
    } = {};
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

    // clusters
    clusterOptions: ClusterModel[];

    // subscribers
    outbreakSubscriber: Subscription;

    // authenticated user
    authUser: UserModel;

    // tell system that we must load chain
    mustLoadChain: boolean = true;

    // snapshots
    snapshotOptions: LabelValuePair[];
    selectedSnapshot: string;

    // cytoscape-graph.component data
    style: any;
    transmissionChainViewType: string;
    markers: WorldMapMarker[] = [];
    lines: WorldMapPath[] = [];
    cy: any;
    transmissionChainViewTypes: LabelValuePair[];
    timelineViewType: string = 'horizontal';
    datesArrayMap: {
        [key: string]: number
    } = {};
    timelineDatesRanks: {
        [date: string]: {
            [id: string]: number
        }
    } = {};
    // show/hide legend?
    showLegend: boolean = true;
    // toggle edit mode
    editMode: boolean = false;
    // toggle full screen
    fullScreen: boolean = false;
    // display labels
    displayLabels: boolean = true;
    // selected layout
    layout: any;
    defaultZoom: any = {
        min: 0.02,
        max: 4
    };
    // layout cola - bubble view
    // Nodes are automatically arranged to optimally use the space
    layoutCola: any = {
        name: 'cola',
        fit: true,
        flow: {axis: 'y', minSeparation: 30},
        padding: 10,
        nodeDimensionsIncludeLabels: true,
        maxSimulationTime: 2000,
        avoidOverlap: true,
        unconstrIter: 10,
        userConstIter: 20,
        // disable animation since fit doesn't work properly with async anim
        animate: false,
        stop: () => {
            if (this.cy) {
                this.cy.fit();
            }
        }
    };
    // layout dagre - tree - hierarchic view
    // the nodes are automatically arranged based on source / target properties
    layoutDagre: any = {
        name: 'dagre',
        fit: true,
        padding: 10,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        nodeSep: 50, // the separation between adjacent nodes in the same rank
        edgeSep: 10, // the separation between adjacent edges in the same rank
        rankSep: 50, // the separation between adjacent nodes in the same rank
        rankDir: 'TB', // 'TB' for top to bottom flow, 'LR' for left to right,
        // disable animation since fit doesn't work properly with async anim
        animate: false,
        stop: () => {
            if (this.cy) {
                this.cy.fit();
            }
        }
    };
    // layout preset - timeline
    // nodes are manually positioned based on date of Reporting
    layoutPreset: any = {
        name: 'preset',
        fit: true,
        padding: 30,
        // disable animation since fit doesn't work properly with async anim
        animate: false,
        stop: () => {
            if (this.cy) {
                this.cy.fit();
            }
        },
        positions: (node) => {
            let posX;
            let posY;
            // restrict position of the node on the x axis for the timeline view
            const nodeData = node.json().data;
            // calculate position on x axis based on the index of the date.
            const datesIndex = this.datesArrayMap[nodeData.dateTimeline] !== undefined ?
                this.datesArrayMap[nodeData.dateTimeline] :
                -1;
            if (this.timelineViewType === 'horizontal') {
                // using 150px as it looks fine
                posX = datesIndex * 200;
            } else {
                // timeline vertical view
                // using 100px as it looks fine
                posY = datesIndex * 100;
            }

            // calculate position on y axis based on the index of the node from that respective date
            if (!_.isEmpty(nodeData.dateTimeline)) {
                let nodeIndex = -1;
                if (nodeData.nodeType === 'checkpoint') {
                    nodeIndex = -1;
                } else {
                    nodeIndex = this.timelineDatesRanks[nodeData.dateTimeline][nodeData.id];
                }
                if (this.timelineViewType === 'horizontal') {
                    // using 100 px as it looks fine
                    posY = (nodeIndex) * 100;
                } else {
                    // timeline vertical view
                    // using 200 px as it looks fine
                    posX = (nodeIndex) * 200;
                }
                return {x: posX, y: posY};
            }
        }
    };
    // the stylesheet for the graph
    defaultStyle: any = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
                'background-image': 'data(picture)',
                'background-fit': 'cover',
                'border-color': 'data(nodeColor)',
                'border-width': 3,
                'shape': 'data(shape)',
                'color': 'data(nodeNameColor)',
                'label': 'data(label)',
                'text-wrap': 'wrap',
                'height': 40,
                'width': 40
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                'line-color': 'data(edgeColor)',
                'line-style': 'data(edgeStyle)',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': 'data(edgeColor)',
                'label': 'data(label)',
                'text-rotation': 'autorotate',
                'text-margin-y': '14px',
                'text-wrap': 'wrap',
                'font-family': 'data(fontFamily)'
            }
        }
    ];
    // the style for the timeline view.
    timelineStyle: any = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
                'background-image': 'data(picture)',
                'background-fit': 'cover',
                'color': 'data(nodeNameColor)',
                'label': 'data(label)',
                'text-wrap': 'wrap',
                'display': 'data(displayTimeline)',
                'height': 'data(height)',
                'width': 'data(width)',
                'shape': 'data(shape)',
                'text-valign': 'data(labelPosition)',
                'border-color': 'data(borderColor)',
                'border-width': 1
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                'line-style': 'data(edgeStyle)',
                'line-color': 'data(edgeColor)',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': 'data(edgeColor)',
                'label': 'data(label)',
                'text-rotation': 'autorotate',
                'text-margin-y': '14px',
                'text-wrap': 'wrap',
                'font-family': 'data(fontFamily)'
            }
        }
    ];

    /**
     * Constructor
     */
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
        protected route: ActivatedRoute,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize style
        this.style = this.style ?
            this.style :
            this.defaultStyle;

        // init filters - only show cases and events first
        this.filters.showContacts = false;
        this.filters.includeContactsOfContacts = false;
        this.filters.showEvents = true;

        // color criteria
        this.nodeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeColorCriteriaOptions();
        this.edgeColorCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeColorCriteriaOptions();
        this.edgeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeLabelCriteriaOptions();
        this.edgeIconCriteriaOptions$ = this.genericDataService.getTransmissionChainEdgeIconCriteriaOptions();
        this.nodeIconCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeIconCriteriaOptions();
        this.nodeShapeCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeShapeCriteriaOptions();
        this.nodeLabelCriteriaOptions$ = this.genericDataService.getTransmissionChainNodeLabelCriteriaOptions();

        // load view types
        this.genericDataService
            .getTransmissionChainViewTypes()
            .subscribe((types: LabelValuePair[]): void => {
                // determine items to which we have access
                const filteredTypes: LabelValuePair[] = [];
                types.forEach((type: LabelValuePair) => {
                    if (
                        (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value &&
                            TransmissionChainModel.canViewBubbleNetwork(this.authUser)
                        ) || (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.HIERARCHICAL_NETWORK.value &&
                            TransmissionChainModel.canViewHierarchicalNetwork(this.authUser)
                        ) || (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value &&
                            TransmissionChainModel.canViewTimelineNetworkDateOfOnset(this.authUser)
                        ) || (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value &&
                            TransmissionChainModel.canViewTimelineNetworkDateOfLastContact(this.authUser)
                        ) || (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value &&
                            TransmissionChainModel.canViewTimelineNetworkDateOfReporting(this.authUser)
                        ) || (
                            type.value === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value &&
                            TransmissionChainModel.canViewGeospatialMap(this.authUser)
                        )
                    ) {
                        filteredTypes.push(type);
                    }
                });

                // default to bubble
                if (
                    !this.transmissionChainViewType &&
                    filteredTypes.length > 0
                ) {
                    // set value
                    this.transmissionChainViewType = filteredTypes[0].value;
                }

                // finished
                this.transmissionChainViewTypes = filteredTypes;
            });

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
                this.filters.locationIds = [global.locationId];
            }

            // classification
            if (global.classificationId) {
                this.filters.classificationId = global.classificationId;
            }
        });

        this.initializeReferenceData()
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
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
                                    this.clusterOptions = clusters;

                                    this.legend.clustersList = {};
                                    _.forEach(clusters, (cluster) => {
                                        this.legend.clustersList[cluster.id] = cluster.name;
                                    });
                                });

                            // retrieve snapshots
                            this.retrieveSnapshotsList();
                        }
                    });
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // release cyto
        this.destroyCytoscape();
    }

    /**
     * Display chains of transmission
     */
    generateChainsOfTransmission() {
        // close settings panel
        this.showFilters = false;
        this.showGraphConfiguration = false;

        // if there is no outbreak then we can't continue
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id ||
            !this.transmissionChainViewType
        ) {
            return;
        }

        // create queryBuilder for filters
        const requestQueryBuilder = new RequestQueryBuilder();
        requestQueryBuilder.filter.firstLevelConditions();

        // retrieve only specific fields so we don't retrieve huge amounts of data that won't be used since we don't have pagination here
        requestQueryBuilder.fields(
            // edges
            'edges.id',
            'edges.persons',
            'edges.certaintyLevelId',
            'edges.socialRelationshipTypeId',
            'edges.socialRelationshipDetail',
            'edges.exposureTypeId',
            'edges.exposureFrequencyId',
            'edges.exposureDurationId',
            'edges.contactDate',
            'edges.clusterId',

            // nodes
            'nodes.id',
            'nodes.type',
            'nodes.date',
            'nodes.dateOfOnset',
            'nodes.dateOfLastContact',
            'nodes.dateOfReporting',
            'nodes.classification',
            'nodes.name',
            'nodes.firstName',
            'nodes.middleName',
            'nodes.lastName',
            'nodes.riskLevel',
            'nodes.gender',
            'nodes.occupation',
            'nodes.outcomeId',
            'nodes.age',
            'nodes.dob',
            'nodes.address',
            'nodes.addresses',
            'nodes.visualId',
            'nodes.classification',
            'nodes.isDateOfOnsetApproximate'
        );

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
            // add this flag only if the user is on a personal chain of transmission
            if (this.personId) {
                requestQueryBuilder.filter.flag('noContactChains', false);
            }

            // this flag is working only if 'showContacts' is true
            if (this.filters.includeContactsOfContacts) {
                requestQueryBuilder.filter.flag('includeContactsOfContacts', 1);
            }
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

            // attach cluster condition
            if (!_.isEmpty(filterObject.clusterIds)) {
                requestQueryBuilder.filter.where({
                    clusterId: {
                        inq: filterObject.clusterIds
                    }
                });
            }
        }

        // display loading
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();

        // get chain data and convert to graph nodes
        this.transmissionChainDataService
            .calculateIndependentTransmissionChains(
                this.selectedOutbreak.id,
                requestQueryBuilder
            )
            .pipe(
                catchError((err) => {
                    // display error message
                    this.snackbarService.showApiError(err);

                    // finished
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((data) => {
                // display message
                this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_GENERATE_SNAPSHOT_IN_PROGRESS');

                // select snapshot
                this.selectedSnapshot = data.transmissionChainId;

                // update list of snapshots
                this.retrieveSnapshotsList();

                // finished
                loadingDialog.close();
            });
    }

    /**
     * Show filters
     */
    showFiltersHideGraphConf(): void {
        this.showFilters = true;
        this.showGraphConfiguration = false;
        this.mustLoadChain = true;
    }

    /**
     * Show graph configuration
     */
    showGraphConfigurationHideFilters(): void {
        this.showFilters = false;
        this.showGraphConfiguration = true;
        this.mustLoadChain = true;
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
        this.legend.edgeColorLabel = this.colorCriteria.edgeColorCriteria === 'clusterId' ? 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER' : this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].label;
        this.legend.edgeIconLabel = this.colorCriteria.edgeIconCriteria === 'clusterId' ?
            'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER' : (
                this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria] ?
                    this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria].label :
                    ''
            );
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

        if (this.colorCriteria.edgeColorCriteria === 'clusterId') {
            // we should check if we have this information, if not we must wait for it to be retrieved
            // #TODO
            // must refactor this entire function :)
            (this.clusterOptions || []).forEach((item) => {
                this.legend.edgeColor[item.id] = item.colorCode ? item.colorCode : Constants.DEFAULT_COLOR_CHAINS;
            });
            this.legend.edgeColorKeys = Object.keys(this.legend.edgeColor);
        } else {
            const edgeColorReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeColorCriteria].refDataCateg], 'entries', []);
            _.forEach(edgeColorReferenceDataEntries, (value) => {
                this.legend.edgeColor[value.value] = value.colorCode ? value.colorCode : Constants.DEFAULT_COLOR_CHAINS;
            });
            this.legend.edgeColorKeys = Object.keys(this.legend.edgeColor);
        }

        if (this.colorCriteria.edgeIconCriteria !== Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.NONE.value) {
            if (this.colorCriteria.edgeIconCriteria === 'clusterId') {
                // we should check if we have this information, if not we must wait for it to be retrieved
                // #TODO
                // must refactor this entire function :)
                (this.clusterOptions || []).forEach((item) => {
                    this.legend.edgeIcon[item.id] = {
                        isUrl: true,
                        url: item.iconUrl
                    };
                });
                this.legend.edgeIconKeys = Object.keys(this.legend.edgeIcon);
            } else {
                const edgeIconReferenceDataEntries = _.get(this.referenceDataEntries[this.referenceDataLabelMap[this.colorCriteria.edgeIconCriteria].refDataCateg], 'entries', []);
                // get edge icons based on the selected criteria
                let getEdgeIconFunc: (criteriaKey: any) => string;
                if (this.colorCriteria.edgeIconCriteria === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value) {
                    getEdgeIconFunc = GraphEdgeModel.getEdgeIconContextOfTransmission;
                } else if (this.colorCriteria.edgeIconCriteria === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.EXPOSURE_TYPE.value) {
                    getEdgeIconFunc = GraphEdgeModel.getEdgeIconExposureType;
                }
                _.forEach(edgeIconReferenceDataEntries, (value) => {
                    this.legend.edgeIcon[value.value] = {
                        icon: getEdgeIconFunc(value.value)
                    };
                });
                this.legend.edgeIconKeys = Object.keys(this.legend.edgeIcon);
            }
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
     * return the png representation of the graph
     * @param {number} splitFactor
     * @returns {any}
     */
    getPng64(splitFactor: number) {
        // we can't continue if cy isn't visible
        if (!this.cyRef) {
            return;
        }

        // page dimensions on the server
        const pageSize = {
            width: 1190,
            // height: 840
        };

        // canvas dimensions
        const originalWidth = this.cyRef.nativeElement.clientWidth;

        // calculate scale between server and original width
        const scaleFactor = Math.round(pageSize.width / originalWidth);

        // calculate scale factor based on split factor.
        let scale = scaleFactor * splitFactor;

        // if scale is calculated as 1, default it to 4 for a better quality of the image
        if (scale <= 1) {
            scale = 4;
        }

        // get png
        let png64 = '';
        if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
            png64 = this.cy.png({bg: 'white', full: true});
        } else {
            png64 = this.cy.png({bg: 'white', scale: scale});
        }

        // finished
        return png64;
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

    /**
     * Update showContactsOfContacts value if showContacts is disabled because
     * user can't see contactsOfContacts without Contacts
     * @param value
     */
    updateShowContactsOfContactValue(value: boolean): void {
        if (value === false) {
            this.filters.includeContactsOfContacts = false;
        }
    }

    /**
     * Release resources
     */
    destroyCytoscape() {
        // release cyto
        if (this.cy) {
            this.cy.destroy();
            this.cy = null;
        }
    }

    /**
     * Full screen toggle from child component to update toggles section
     * @param {boolean} fullScreenToggle
     */
    onFullScreenToggle(fullScreenToggle: boolean) {
        this.fullScreen = fullScreenToggle;
        if (this.fullScreen) {
            this.editMode = false;
            this.toggleEditMode();
        }
    }

    /**
     * Render cytoscape graph
     */
    renderGraph() {
        // no need to do anything for geo map
        if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value) {
            // release cyto
            this.destroyCytoscape();

            // finished
            return;
        }

        // can't render ?
        if (!this.cyRef) {
            return;
        }

        // load the correct layout based on the view selected
        this.configureGraphViewType();

        // release cyto
        this.destroyCytoscape();

        // display loading
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        setTimeout(() => {
            // initialize the cytoscape object
            this.cy = cytoscape(Object.assign(
                {
                    container: this.cyRef.nativeElement
                },
                {
                    layout: this.layout,
                    style: this.style,
                    elements: this.graphElements,
                    minZoom: this.defaultZoom.min,
                    maxZoom: this.defaultZoom.max,
                    wheelSensitivity: TransmissionChainsDashletComponent.wheelSensitivity
                }
            ));

            // add node tap event
            this.cy.on('tap', 'node', (evt) => {
                const node = evt.target;
                this.nodeTapped.emit(node.json().data);
            });

            // add edge tap event
            this.cy.on('tap', 'edge', (evt) => {
                const edge = evt.target;
                this.edgeTapped.emit(edge.json().data);
            });

            // finished
            loadingDialog.close();
        });
    }

    /**
     * Generate the array of dates to be used on the timeline views
     */
    calculateTimelineDates() {
        // empty the already set timeline and dates arrays
        this.datesArrayMap = {};
        this.timelineDatesRanks = {};
        const nodes = this.graphElements ?
            _.sortBy(this.graphElements.nodes, 'data.dateTimeline') :
            [];

        // loop through all the nodes to set their position based on date and relations
        let index: number = 0;
        _.forEach(nodes, (node, key) => {
            // check if the node has a date to be taken into consideration
            if (!_.isEmpty(node.data.dateTimeline)) {
                // check if there is already a node added to that date
                if (this.timelineDatesRanks[node.data.dateTimeline]) {
                    // check if the node was not already processed - rank / position set
                    if (
                        !this.timelineDatesRanks[node.data.dateTimeline][node.data.id] &&
                        this.timelineDatesRanks[node.data.dateTimeline][node.data.id] !== 0
                    ) {
                        this.setNodeRankDate(node);
                    }
                } else {
                    // the node is the first one on the date
                    this.setFirstNodeOnDate(node);
                }

                // check related nodes
                this.setRelatedNodesRank(node);
                if (!this.datesArrayMap[node.data.dateTimeline]) {
                    this.datesArrayMap[node.data.dateTimeline] = index++;
                }
            }
        });
    }

    /**
     * return an array with the related nodes
     * @param nodeId
     * @returns {any[]}
     */
    getRelatedNodes(nodeId) {
        const relatedNodes = [];
        _.forEach(this.graphElements.edges, (edge, key) => {
            if (edge.data.source === nodeId) {
                const node = this.getNode(edge.data.target);
                relatedNodes.push(node);
            }
            if (edge.data.target === nodeId) {
                const node = this.getNode(edge.data.source);
                relatedNodes.push(node);
            }
        });
        return relatedNodes;
    }

    /**
     * Return the node object
     * @param nodeId
     * @returns {any}
     */
    getNode(nodeId) {
        let foundNode = null;
        _.forEach(this.graphElements.nodes, (node, key) => {
            if (node.data.id === nodeId) {
                foundNode = node;
            }
        });
        return foundNode;
    }

    /**
     * return the maximum occupied position (rank) on a specific date
     * @param dateRanks
     * @returns {number}
     */
    getMaxRankDate(dateRanks) {
        let maxRank = -1;
        if (dateRanks) {
            _.forEach(Object.keys(dateRanks), (dateRank) => {
                if (dateRanks[dateRank] > maxRank) {
                    maxRank = dateRanks[dateRank];
                }
            });
        }
        return maxRank;
    }

    /**
     * get maximum position between 2 dates
     * @param startDate
     * @param endDate
     * @returns {number}
     */
    getMaxRankDateInterval(startDate, endDate) {
        let maxRank = -1;
        let sDate = moment(startDate);
        const eDate = moment(endDate);
        while (sDate < eDate) {
            sDate = sDate.add(1, 'days');
            const maxRankDate = this.getMaxRankDate(this.timelineDatesRanks[sDate.format('YYYY-MM-DD')]);
            if (maxRankDate > maxRank) {
                maxRank = maxRankDate;
            }
        }
        return maxRank;
    }

    /**
     * determine and set the position of a node on its date - if it's not the first node on the date
     * @param node
     */
    setNodeRankDate(node) {
        // if the node is checkpoint, then display it on -1 rank
        if (node.data.nodeType === 'checkpoint') {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
        } else {
            // get max rank for that date
            const maxRankDate = this.getMaxRankDate(this.timelineDatesRanks[node.data.dateTimeline]);

            // set rank to max +_1
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = maxRankDate + 1;
        }
    }

    /**
     * determine and set the position of a node on its date - if it's the first node on the date
     * @param node
     */
    setFirstNodeOnDate(node) {
        this.timelineDatesRanks[node.data.dateTimeline] = {};
        if (node.data.nodeType === 'checkpoint') {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
        } else {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = 0;
        }
    }

    /**
     * determine and set the position for the related nodes.
     * also block position between the initial node and the related node
     * @param node
     */
    setRelatedNodesRank(node) {
        // check if the node has related nodes and assign ranks to those as well.
        let maxRankPerParentNode = -1;
        const relatedNodes = this.getRelatedNodes(node.data.id);
        if (!_.isEmpty(relatedNodes)) {
            _.forEach(relatedNodes, (relatedNode, relatedKey) => {
                // get max rank from the date interval
                const maxRankPerDateInterval = this.getMaxRankDateInterval(node.data.dateTimeline, relatedNode.data.dateTimeline);
                let maxRankToBlock = -1;
                if (this.timelineDatesRanks[relatedNode.data.dateTimeline]) {
                    // check if node rank was already calculated
                    if (
                        !this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] &&
                        this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] !== 0
                    ) {
                        if (relatedNode.data.nodeType === 'checkpoint') {
                            this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = -1;
                        } else {
                            // position of the node should be the maximum between:
                            // max position from the siblings
                            // max position from the date interval between the parent node and the related node
                            // max position from the date
                            let maxRankDateRelatedNode = this.getMaxRankDate(this.timelineDatesRanks[relatedNode.data.dateTimeline]);
                            maxRankDateRelatedNode = Math.max(maxRankPerParentNode, maxRankPerDateInterval, maxRankDateRelatedNode);
                            maxRankToBlock = maxRankDateRelatedNode + 1;
                            maxRankPerParentNode = maxRankDateRelatedNode + 1;
                            this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = maxRankDateRelatedNode + 1;
                        }
                    }
                } else {
                    this.timelineDatesRanks[relatedNode.data.dateTimeline] = {};
                    const maxRankRelatedNode = Math.max(maxRankPerParentNode, maxRankPerDateInterval);
                    // set the position to max position from its siblings + 1
                    this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = maxRankRelatedNode + 1;
                    maxRankToBlock = maxRankRelatedNode + 1;
                    maxRankPerParentNode = maxRankRelatedNode + 1;
                }
                // block rank on previous dates
                let startDate = moment(node.data.dateTimeline);
                const endDate = moment(relatedNode.data.dateTimeline);
                // add an entry called maxRank on all the dates between the nodes
                while (startDate < endDate) {
                    startDate = startDate.add(1, 'days');
                    if (!this.timelineDatesRanks[startDate.format('YYYY-MM-DD')]) {
                        this.timelineDatesRanks[startDate.format('YYYY-MM-DD')] = {};
                    }
                    this.timelineDatesRanks[startDate.format('YYYY-MM-DD')]['maxRank'] = maxRankToBlock;
                }
            });
        }
    }

    /**
     * re-render the layout on view type change
     */
    updateView() {
        // wait for binding
        setTimeout(() => {
            // refresh chain to load the new criteria
            this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(
                this.chainGroup.clone(),
                this.filters,
                this.legend,
                this.locationsListMap,
                this.transmissionChainViewType,
                this.chainPages && this.chainPages[this.selectedChainPageIndex] ?
                    this.chainPages[this.selectedChainPageIndex] :
                    undefined
            );

            // configure geo map
            if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value) {
                this.initGeospatialMap();
            }

            // render
            this.renderGraph();
        });
    }

    /**
     * Configure the view type for graph
     */
    configureGraphViewType() {
        // Decide what layout to use based on the view type selected or send at initialization
        if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value) {
            cytoscape.use(cola);
            this.layout = this.layoutCola;
            this.style = this.defaultStyle;
        } else if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.HIERARCHICAL_NETWORK.value) {
            cytoscape.use(dagre);
            this.layout = this.layoutDagre;
            this.style = this.defaultStyle;
        } else if (
            this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value ||
            this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value ||
            this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value
        ) {
            this.calculateTimelineDates();
            this.style = this.timelineStyle;
            this.layout = this.layoutPreset;
        }
    }

    /**
     * decide if the link to cases without dates will be displayed
     * @returns {boolean}
     */
    showCaseNodesWithoutDates() {
        return (
            (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value)
            && this.graphElements
            && this.graphElements.caseNodesWithoutDates.length
        );
    }

    /**
     * decide if the link to contacts without dates will be displayed
     * @returns {boolean}
     */
    showContactNodesWithoutDates() {
        return (
            (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value)
            && this.graphElements
            && this.graphElements.contactNodesWithoutDates.length
        );
    }

    /**
     * decide if the link to events without dates will be displayed
     * @returns {boolean}
     */
    showEventNodesWithoutDates() {
        return (
            (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value)
            && this.graphElements
            && this.graphElements.eventNodesWithoutDates.length
        );
    }

    /**
     * switch timeline view type: vertical / horizontal
     * @param timelineViewType
     */
    switchTimelineView(timelineViewType) {
        this.timelineViewType = timelineViewType;
        this.renderGraph();
    }

    /**
     * Edit mode
     */
    toggleEditMode() {
        this.changeEditMode.emit(this.editMode);
    }

    /**
     * Get title to be displayed for cases without dates
     * @returns {string}
     */
    getCasesWithoutDatesTitle() {
        let title = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CASES_WITHOUT_DATE_OF_ONSET_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CASES_WITHOUT_DATE_OF_LAST_CONTACT_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CASES_WITHOUT_DATE_OF_REPORTING_TITLE';
                break;

            default:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CASES_WITHOUT_DATE_OF_ONSET_TITLE';

        }
        return title;
    }

    /**
     * Get title to be displayed for contacts without dates
     * @returns {string}
     */
    getContactsWithoutDatesTitle() {
        let title = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CASES_WITHOUT_DATE_OF_REPORTING_TITLE';
                break;

            default:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_TITLE';

        }
        return title;
    }

    /**
     * Get title to be displayed for events without dates
     * @returns {string}
     */
    getEventsWithoutDatesTitle() {
        let title = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EVENTS_WITHOUT_DATE_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EVENTS_WITHOUT_DATE_TITLE';
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EVENTS_WITHOUT_DATE_OF_REPORTING_TITLE';
                break;

            default:
                title = 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EVENTS_WITHOUT_DATE_TITLE';

        }
        return title;
    }

    /**
     * return the correct list filter per view
     * @returns {string}
     */
    getCasesListFilter() {
        let filter = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                filter = Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                filter = Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                filter = Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_REPORTING_CHAIN;
                break;

            default:
                filter = Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN;

        }
        return filter;
    }

    /**
     * return the correct list filter per view
     * @returns {string}
     */
    getContactsListFilter() {
        let filter = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                filter = Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                filter = Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                filter = Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN;
                break;

            default:
                filter = Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN;

        }
        return filter;
    }

    /**
     * return the correct list filter per view
     * @returns {string}
     */
    getEventsListFilter() {
        let filter = '';
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                filter = Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                filter = Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN;
                break;

            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                filter = Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN;
                break;

            default:
                filter = Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN;

        }
        return filter;
    }

    /**
     * Init geospatial map
     */
    initGeospatialMap() {
        // reset data
        this.markers = [];
        this.lines = [];

        // are e allowed to display geo map ?
        if (!TransmissionChainModel.canViewGeospatialMap(this.authUser)) {
            return;
        }

        // we don't need to continue if we don't have data
        if (
            _.isEmpty(this.chainGroup) ||
            _.isEmpty(this.graphElements) ||
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // determine map nodes
        forkJoin(
            this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE),
            this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CERTAINTY_LEVEL),
            this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
        ).subscribe(([
            personTypes,
            certaintyLevels,
            caseClassification
        ]: [
            ReferenceDataCategoryModel,
            ReferenceDataCategoryModel,
            ReferenceDataCategoryModel
        ]) => {
            // map colors to types
            const typeToColorMap = {};
            _.each(personTypes.entries, (entry: ReferenceDataEntryModel) => {
                typeToColorMap[entry.id] = entry.colorCode;
            });

            // map certainty level to color
            const certaintyLevelToColorMap = {};
            _.each(certaintyLevels.entries, (entry: ReferenceDataEntryModel) => {
                certaintyLevelToColorMap[entry.id] = entry.colorCode;
            });

            // map case classification to color
            const caseClassificationToColorMap = {};
            _.each(caseClassification.entries, (entry: ReferenceDataEntryModel) => {
                caseClassificationToColorMap[entry.id] = entry.colorCode;
            });

            // reset data
            const markersMap: {
                [idEntityModel: string]: WorldMapMarker
            } = {};
            this.markers = [];
            this.lines = [];

            // add valid address to marked
            const markerCircleRadius: number = 7;
            const addValidAddressToMarker = (
                address: AddressModel,
                entity: EntityModel,
                gNode: { data: GraphNodeModel }
            ) => {
                // validate address
                if (
                    _.isEmpty(address) ||
                    _.isEmpty(address.geoLocation) ||
                    !_.isNumber(address.geoLocation.lat) ||
                    !_.isNumber(address.geoLocation.lng)
                ) {
                    return;
                }

                // create marker
                const marker: WorldMapMarker = new WorldMapMarker({
                    point: new WorldMapPoint(
                        address.geoLocation.lat,
                        address.geoLocation.lng
                    ),
                    layer: WorldMapMarkerLayer.CLUSTER,
                    overlaySingleDisplayLabel: true,
                    type: WorldMapMarkerType.CIRCLE,
                    radius: markerCircleRadius,
                    color: typeToColorMap[entity.type] ? typeToColorMap[entity.type] : Constants.DEFAULT_COLOR_CHAINS,
                    label: gNode.data.name,
                    labelColor: (entity.model as CaseModel).classification && caseClassificationToColorMap[(entity.model as CaseModel).classification] ?
                        caseClassificationToColorMap[(entity.model as CaseModel).classification] :
                        Constants.DEFAULT_COLOR_CHAINS,
                    data: entity,
                    selected: (mapComponent: WorldMapComponent, mark: WorldMapMarker) => {
                        // display entity information ( case / contact / event )
                        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
                        const localEntity: EntityModel = mark.data;
                        this.entityDataService
                            .getEntity(localEntity.type, this.selectedOutbreak.id, localEntity.model.id)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    loadingDialog.close();
                                    return throwError(err);
                                })
                            )
                            .subscribe((entityData: CaseModel | EventModel | ContactModel) => {
                                // hide loading dialog
                                loadingDialog.close();

                                // show node information
                                this.dialogService.showCustomDialog(
                                    ViewCotNodeDialogComponent,
                                    {
                                        ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
                                        ...{
                                            data: {
                                                entity: entityData
                                            }
                                        }
                                    }
                                );
                            });
                    }
                });

                // add marker
                this.markers.push(marker);

                // add marker to map list
                markersMap[entity.model.id] = marker;
            };

            // go through nodes that are rendered on COT graph and determine what we can render on geo-map
            _.each(this.graphElements.nodes, (gNode: { data: GraphNodeModel }) => {
                // get case / contact / event ...
                const entity: EntityModel = this.chainGroup.nodesMap[gNode.data.id];
                if (!_.isEmpty(entity)) {
                    switch (entity.type) {
                        // events
                        case EntityType.EVENT:
                            addValidAddressToMarker(
                                (entity.model as EventModel).address,
                                entity,
                                gNode
                            );
                            break;

                        // contacts ( same as case )
                        case EntityType.CONTACT:
                            addValidAddressToMarker(
                                _.find(
                                    (entity.model as ContactModel).addresses,
                                    {
                                        typeId: AddressType.CURRENT_ADDRESS
                                    }
                                ),
                                entity,
                                gNode
                            );
                            break;

                        // cases ( same as contact )
                        case EntityType.CASE:
                            addValidAddressToMarker(
                                _.find(
                                    (entity.model as CaseModel).addresses,
                                    {
                                        typeId: AddressType.CURRENT_ADDRESS
                                    }
                                ),
                                entity,
                                gNode
                            );
                            break;

                        // contact of contacts
                        case EntityType.CONTACT_OF_CONTACT:
                            addValidAddressToMarker(
                                _.find(
                                    (entity.model as ContactOfContactModel).addresses,
                                    {
                                        typeId: AddressType.CURRENT_ADDRESS
                                    }
                                ),
                                entity,
                                gNode
                            );
                            break;
                    }
                }
            });

            // map relationships
            const relationshipMap: {
                [idRelationship: string]: RelationshipModel
            } = {};
            _.each(this.chainGroup.relationships, (relationship: RelationshipModel) => {
                relationshipMap[relationship.id] = relationship;
            });

            // render relationships
            _.each(this.graphElements.edges, (gEdge: { data: GraphEdgeModel }) => {
                // render relation
                const relationship: RelationshipModel = relationshipMap[gEdge.data.id];
                if (
                    !_.isEmpty(relationship) &&
                    markersMap[gEdge.data.source] &&
                    markersMap[gEdge.data.target]
                ) {
                    this.lines.push(new WorldMapPath({
                        hideOnMarkerCluster: true,
                        label: this.i18nService.instant(
                            'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_RELATIONSHIP_LABEL', {
                                item1: markersMap[gEdge.data.source].label,
                                item2: markersMap[gEdge.data.target].label
                            }
                        ),
                        points: [
                            markersMap[gEdge.data.source],
                            markersMap[gEdge.data.target]
                        ],
                        color: certaintyLevelToColorMap[relationship.certaintyLevelId] ? certaintyLevelToColorMap[relationship.certaintyLevelId] : Constants.DEFAULT_COLOR_CHAINS,
                        type: WorldMapPathType.ARROW,
                        lineWidth: 5,
                        offsetX: -(markerCircleRadius * 2 + 3),
                        data: relationship,
                        selected: (mapComponent: WorldMapComponent, path: WorldMapPath) => {
                            // display relationship information
                            const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
                            const localRelationship: RelationshipModel = path.data;
                            this.relationshipDataService
                                .getEntityRelationship(
                                    this.selectedOutbreak.id,
                                    localRelationship.sourcePerson.type,
                                    localRelationship.sourcePerson.id,
                                    localRelationship.id
                                )
                                .pipe(
                                    catchError((err) => {
                                        this.snackbarService.showApiError(err);
                                        loadingDialog.close();
                                        return throwError(err);
                                    })
                                )
                                .subscribe((relationshipData) => {
                                    // hide loading dialog
                                    loadingDialog.close();

                                    // show edge information
                                    this.dialogService.showCustomDialog(
                                        ViewCotEdgeDialogComponent,
                                        {
                                            ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
                                            ...{
                                                data: {
                                                    relationship: relationshipData
                                                }
                                            }
                                        }
                                    );
                                });
                        }
                    }));
                }
            });
        });
    }

    /**
     * Zoom graph
     * @param value
     */
    zoomGraph(value: number) {
        // there is no graph initialized ?
        if (!this.cy) {
            return;
        }

        // restrict zoom to boundaries
        let zoomValue: number = Math.round((this.cy.zoom() + value) * 100) / 100.0;
        if (zoomValue < this.cy.minZoom()) {
            zoomValue = this.cy.minZoom();
        } else if (zoomValue > this.cy.maxZoom()) {
            zoomValue = this.cy.maxZoom();
        }

        // no point in trying to zoom if zoom level is already there
        if (zoomValue === this.cy.zoom()) {
            return;
        }

        // zoom
        this.cy.animate({
            zoom: {
                level: zoomValue,
                renderedPosition: {
                    x: this.cy.width() / 2,
                    y: this.cy.height() / 2
                }
            }
        }, {
            duration: 200
        });
    }

    /**
     * Zoom in graph
     */
    zoomInGraph() {
        this.zoomGraph(TransmissionChainsDashletComponent.wheelSensitivity);
    }

    /**
     * Zoom out graph
     */
    zoomOutGraph() {
        this.zoomGraph(-TransmissionChainsDashletComponent.wheelSensitivity);
    }

    /**
     * Check if we have the option to edit data
     */
    isEditModeAvailable(): boolean {
        switch (this.transmissionChainViewType) {
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value:
                return TransmissionChainModel.canModifyBubbleNetwork(this.authUser);
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.HIERARCHICAL_NETWORK.value:
                return TransmissionChainModel.canModifyHierarchicalNetwork(this.authUser);
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value:
                return TransmissionChainModel.canModifyTimelineNetworkDateOfOnset(this.authUser);
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value:
                return TransmissionChainModel.canModifyTimelineNetworkDateOfLastContact(this.authUser);
            case Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value:
                return TransmissionChainModel.canModifyTimelineNetworkDateOfReporting(this.authUser);
        }

        // finished
        return false;
    }

    /**
     * Retrieve snapshots list
     */
    retrieveSnapshotsList(): void {
        // do we have required data ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // configure query builder
        const qb = new RequestQueryBuilder();

        // sort
        qb.sort.by(
            'startDate',
            RequestSortDirection.DESC
        );

        // filter out failed
        qb.filter.where({
            status: {
                neq: Constants.COT_SNAPSHOT_STATUSES.LNG_COT_STATUS_FAILED.value
            }
        });

        // created by current user
        qb.filter.byEquality(
            'createdBy',
            this.authUser.id
        );

        // retrieve snapshots
        this.transmissionChainDataService
            .getSnapshotsList(
                this.selectedOutbreak.id,
                qb
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe((snapshots) => {
                // format snapshots
                this.snapshotOptions = [];
                (snapshots || []).forEach((snapshot) => {
                    // snapshot name
                    const name: string = snapshot.startDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT);

                    // add snapshot to list of options
                    this.snapshotOptions.push(new LabelValuePair(
                        snapshot.status === Constants.COT_SNAPSHOT_STATUSES.LNG_COT_STATUS_IN_PROGRESS.value ?
                            this.i18nService.instant(
                                'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_SNAPSHOT_STATUS__IN_PROGRESS', {
                                    name: name
                                }
                            ) :
                            name,
                        snapshot.id,
                        snapshot.status === Constants.COT_SNAPSHOT_STATUSES.LNG_COT_STATUS_IN_PROGRESS.value
                    ));
                });
            });
    }

    /**
     * Retrieve snapshot / refresh graph
     */
    loadChainsOfTransmission(): void {
        // do we have required data ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id ||
            !this.selectedSnapshot
        ) {
            return;
        }

        // hide filters & confs
        this.showFilters = false;
        this.showGraphConfiguration = false;

        // chain loaded
        this.mustLoadChain = false;

        // configure data
        if (this.transmissionChainViewType !== Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value) {
            // format chart
            this.mapColorCriteria();
        }

        // same group, we don't need to retrieve anything from BE ?
        if (this.chainGroupId === this.selectedSnapshot) {
            // must update pages ?
            if (this.chainPageSize !== this.pageSize) {
                this.chainPageSize = this.pageSize;
                this.chainPages = this.transmissionChainDataService.getChainOfTransmissionPages(
                    this.chainGroup,
                    this.pageSize
                );
            }

            // update view
            this.updateView();

            // finished
            return;
        }

        // retrieve chain of transmission
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.chainGroup = undefined;
        this.chainPages = undefined;
        this.selectedChainPageIndex = 0;
        this.chainGroupId = this.selectedSnapshot;
        this.transmissionChainDataService
            .getCalculatedIndependentTransmissionChains(
                this.selectedOutbreak.id,
                this.selectedSnapshot
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // finished
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((chainGroup) => {
                // determine locations that we need to retrieve
                let locationIdsToRetrieve: any = {};
                _.forEach(chainGroup.nodesMap, (node) => {
                    // determine main address
                    let mainAddress: AddressModel;
                    if (node.type === EntityType.EVENT) {
                        mainAddress = (node.model as EventModel).address;
                    } else {
                        mainAddress = (node.model as CaseModel | ContactModel | ContactOfContactModel).mainAddress;
                    }

                    // check if we have location
                    if (
                        mainAddress &&
                        mainAddress.locationId
                    ) {
                        locationIdsToRetrieve[mainAddress.locationId] = true;
                    }
                });

                // transform locations to array
                locationIdsToRetrieve = Object.keys(locationIdsToRetrieve);

                // do we need to retrieve locations ?
                if (locationIdsToRetrieve.length < 1) {
                    // reset locations
                    this.locationsListMap = {};

                    // keep original chains
                    this.chainGroup = chainGroup;
                    this.chainPageSize = this.pageSize;
                    this.chainPages = this.transmissionChainDataService.getChainOfTransmissionPages(
                        this.chainGroup,
                        this.pageSize
                    );

                    // finished
                    loadingDialog.close();

                    // update view
                    this.updateView();
                } else {
                    // retrieve locations
                    const locationQueryBuilder = new RequestQueryBuilder();
                    locationQueryBuilder.fields('id', 'name');
                    locationQueryBuilder.filter.bySelect(
                        'id',
                        locationIdsToRetrieve,
                        false,
                        null
                    );
                    this.locationDataService
                        .getLocationsList(locationQueryBuilder)
                        .pipe(
                            catchError((err) => {
                                // display error message
                                this.snackbarService.showApiError(err);

                                // finished
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe((locations) => {
                            // map locations
                            this.locationsListMap = {};
                            (locations || []).forEach((location) => {
                                this.locationsListMap[location.id] = location;
                            });

                            // keep original chains
                            this.chainGroup = chainGroup;
                            this.chainPageSize = this.pageSize;
                            this.chainPages = this.transmissionChainDataService.getChainOfTransmissionPages(
                                this.chainGroup,
                                this.pageSize
                            );

                            // finished
                            loadingDialog.close();

                            // update view
                            this.updateView();
                        });
                }
            });
    }

    /**
     * Page size changed
     */
    pageSizeChanged(pageSize: number) {
        this.pageSize = pageSize;
        this.mustLoadChain = true;
    }
}


