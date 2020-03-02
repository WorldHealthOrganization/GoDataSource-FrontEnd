import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';
import * as cola from 'cytoscape-cola';
import * as dagre from 'cytoscape-dagre';
import { forkJoin, Observable, Subscription, throwError } from 'rxjs';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import * as _ from 'lodash';
import { WorldMapComponent, WorldMapMarker, WorldMapMarkerLayer, WorldMapMarkerType, WorldMapPath, WorldMapPathType, WorldMapPoint } from '../../../../common-modules/world-map/components/world-map/world-map.component';
import { IConvertChainToGraphElements } from '../../../../core/services/data/transmission-chain.data.service';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ViewCotEdgeDialogComponent } from '../../../../shared/components/view-cot-edge-dialog/view-cot-edge-dialog.component';
import { LoadingDialogModel } from '../../../../shared/components/loading-dialog/loading-dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EntityType } from '../../../../core/models/entity-type';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError, map } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ViewCotNodeDialogComponent } from '../../../../shared/components';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-cytoscape-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cytoscape-graph.component.html',
    styleUrls: ['./cytoscape-graph.component.less']
})
export class CytoscapeGraphComponent implements OnChanges, OnInit, OnDestroy {
    static wheelSensitivity: number = 0.3;

    private _elements: IConvertChainToGraphElements;
    @Input() set elements(elements: IConvertChainToGraphElements) {
        // set elements
        this._elements = elements;

        // init geospatial map data
        this.initGeospatialMap();
    }

    get elements(): IConvertChainToGraphElements {
        return this._elements;
    }

    private _chainElements: TransmissionChainModel[];
    @Input() set chainElements(chainElements: TransmissionChainModel[]) {
        // set data
        this._chainElements = chainElements;

        // init geospatial map data
        this.initGeospatialMap();
    }

    get chainElements(): TransmissionChainModel[] {
        return this._chainElements;
    }

    @Input() style;
    transmissionChainViewType: string;
    @Input() legend: any;

    markers: WorldMapMarker[] = [];
    lines: WorldMapPath[] = [];

    @Output() nodeTapped = new EventEmitter<any>();
    @Output() edgeTapped = new EventEmitter<any>();
    @Output() viewTypeChanged = new EventEmitter<any>();
    @Output() changeEditMode = new EventEmitter<boolean>();

    @ViewChild(WorldMapComponent) worldMap;

    // authenticated user
    authUser: UserModel;

    Constants = Constants;
    WorldMapMarkerLayer = WorldMapMarkerLayer;
    cy: any;
    container: string = 'cy';
    transmissionChainViewTypes$: Observable<LabelValuePair[]>;
    timelineViewType: string = 'horizontal';
    // show/hide legend?
    showLegend: boolean = true;
    // toggle edit mode
    editMode: boolean = false;
    // toggle full screen
    fullScreen: boolean = false;

    // display labels
    displayLabels: boolean = true;

    /**
     *  layout cola - bubble view
     *  Nodes are automatically arranged to optimally use the space
     */
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
        stop: () => {
            this.showLoading = false;
            if (this.cy) {
                this.cy.fit();
            }
        }
    };

    /**
     *  layout dagre - tree - hierarchic view
     *  the nodes are automatically arranged based on source / target properties
     */
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
        stop: () => {
            this.showLoading = false;
            if (this.cy) {
                this.cy.fit();
            }
        }
    };

    /**
     *  layout preset - timeline
     *  nodes are manually positioned based on date of Reporting
     */
    layoutPreset: any = {
        name: 'preset',
        fit: true,
        padding: 30,
        stop: () => {
            this.showLoading = false;
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
            const datesIndex = _.findIndex(
                this.datesArray,
                function (o) {
                    return o === nodeData.dateTimeline;
                });
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

    // selected layout
    layout: any;
    defaultZoom: any = {
        min: 0.02,
        max: 4
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

    showLoading: boolean = true;
    datesArray: string[] = [];
    timelineDatesRanks: any = {};

    // subscribers
    outbreakSubscriber: Subscription;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private el: ElementRef,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private relationshipDataService: RelationshipDataService,
        private i18nService: I18nService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize style
        this.style =
            this.style ?
                this.style :
                this.defaultStyle;

        // load view types
        this.transmissionChainViewTypes$ = this.genericDataService
            .getTransmissionChainViewTypes()
            .pipe(
                map((types: LabelValuePair[]): LabelValuePair[] => {
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
                        this.updateView({
                            value: filteredTypes[0].value
                        });
                    }

                    // finished
                    return filteredTypes;
                })
            );

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // init geospatial map data
                this.initGeospatialMap();
            });
    }

    /**
     * Component removed
     */
    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Component changes trigger
     */
    public ngOnChanges(): any {
        // render cytoscape object
        this.render();
    }

    /**
     * Full screen toggle from child component to update toggles section
     * @param {boolean} fullScreenToggle
     */
    onFullScreenToggle(fullScreenToggle: boolean) {
        this.fullScreen = fullScreenToggle;
    }

    /**
     * Render cytoscape graph
     */
    render() {
        // no need to do anything for geo map
        if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value) {
            // hide loading since we don't need to retrieve graph data
            this.showLoading = false;

            // finished
            return;
        }

        // render graph element
        const nativeElement = this.el.nativeElement;
        const container = nativeElement.getElementsByClassName(this.container);

        // load the correct layout based on the view selected
        this.configureGraphViewType();

        // initialize the cytoscape object
        this.cy = cytoscape({
            container: container[0],
            layout: this.layout,
            style: this.style,
            elements: this.elements,
            minZoom: this.defaultZoom.min,
            maxZoom: this.defaultZoom.max,
            wheelSensitivity: CytoscapeGraphComponent.wheelSensitivity,
            // #TODO replace with new cytoscape version equivalent?
            // ready: () => {
            //     // show spinner when layout starts to draw
            //     this.showLoading = true;
            // }
        });
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
    }

    /**
     * Generate the array of dates to be used on the timeline views
     */
    calculateTimelineDates() {
        // empty the already set timeline and dates arrays
        this.datesArray = [];
        this.timelineDatesRanks = {};
        const nodes = this.elements ?
            _.sortBy(this.elements.nodes, 'data.dateTimeline') :
            [];
        // loop through all the nodes to set their position based on date and relations
        _.forEach(nodes, (node, key) => {
            // check if the node has a date to be taken into consideration
            if (!_.isEmpty(node.data.dateTimeline)) {
                // check if there is already a node added to that date
                if (this.timelineDatesRanks[node.data.dateTimeline]) {
                    // check if the node was not already processed - rank / position set
                    if (!this.timelineDatesRanks[node.data.dateTimeline][node.data.id] &&
                        this.timelineDatesRanks[node.data.dateTimeline][node.data.id] !== 0) {
                        this.setNodeRankDate(node);
                    }
                } else {
                    // the node is the first one on the date
                    this.setFirstNodeOnDate(node);
                }
                // check related nodes
                this.setRelatedNodesRank(node);
                this.datesArray.push(node.data.dateTimeline);
            }
        });
        this.datesArray = _.uniq(this.datesArray);
        this.datesArray = _.sortBy(this.datesArray);
    }

    /**
     * return an array with the related nodes
     * @param nodeId
     * @returns {any[]}
     */
    getRelatedNodes(nodeId) {
        const relatedNodes = [];
        _.forEach(this.elements.edges, (edge, key) => {
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
        _.forEach(this.elements.nodes, (node, key) => {
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
        this.timelineDatesRanks[node.data.dateTimeline] = [];
        if (node.data.nodeType === 'checkpoint') {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
        } else {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = 0;
        }
    }

    /**
     * determine and set the position for the related nodes.
     * also block position betwene the initial node and the related node
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
                    if (!this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id]
                        && this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] !== 0) {
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
                    this.timelineDatesRanks[relatedNode.data.dateTimeline] = [];
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
                        this.timelineDatesRanks[startDate.format('YYYY-MM-DD')] = [];
                    }
                    this.timelineDatesRanks[startDate.format('YYYY-MM-DD')]['maxRank'] = maxRankToBlock;
                }
            });
        }
    }

    /**
     * re-render the layout on view type change
     */
    updateView($event) {
        this.transmissionChainViewType = $event.value;
        this.render();
        this.viewTypeChanged.emit($event);
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
        } else if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
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
            && this.elements
            && this.elements.caseNodesWithoutDates.length
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
            && this.elements
            && this.elements.contactNodesWithoutDates.length
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
            && this.elements
            && this.elements.eventNodesWithoutDates.length
        );
    }

    /**
     * switch timeline view type: vertical / horizontal
     * @param timelineViewType
     */
    switchTimelineView(timelineViewType) {
        this.timelineViewType = timelineViewType;
        this.render();
    }

    toggleEditMode() {
        this.changeEditMode.emit(this.editMode);
    }

    /**
     * return the png representation of the graph
     * @param {number} splitFactor
     * @returns {any}
     */
    getPng64(splitFactor: number) {
        // page dimensions on the server
        const pageSize = {
            width: 1190,
            // height: 840
        };

        // canvas dimensions
        // const originalHeight = document.getElementById('cy').clientHeight;
        const originalWidth = document.getElementById('cy').clientWidth;

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

        // determine map nodes
        if (
            !_.isEmpty(this.chainElements) &&
            !_.isEmpty(this.elements) &&
            !_.isEmpty(this.selectedOutbreak)
        ) {
            forkJoin(
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE),
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CERTAINTY_LEVEL),
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
            )
                .subscribe(([
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
                    const firstChain: TransmissionChainModel = this.chainElements[0];
                    _.each(this.elements.nodes, (gNode: { data: GraphNodeModel }) => {
                        // get case / contact / event ...
                        const entity: EntityModel = firstChain.nodes[gNode.data.id];
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
                            }
                        }
                    });

                    // map relationships
                    const relationshipMap: {
                        [idRelationship: string]: RelationshipModel
                    } = {};
                    _.each(firstChain.relationships, (relationship: RelationshipModel) => {
                        relationshipMap[relationship.id] = relationship;
                    });

                    // render relationships
                    _.each(this.elements.edges, (gEdge: { data: GraphEdgeModel }) => {
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
                                                this.snackbarService.showError(err.message);
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
        this.zoomGraph(CytoscapeGraphComponent.wheelSensitivity);
    }

    /**
     * Zoom out graph
     */
    zoomOutGraph() {
        this.zoomGraph(-CytoscapeGraphComponent.wheelSensitivity);
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
}
