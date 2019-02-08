import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';
import * as cola from 'cytoscape-cola';
import * as dagre from 'cytoscape-dagre';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { Constants } from '../../../core/models/constants';
import * as _ from 'lodash';
import * as moment from 'moment';


@Component({
    selector: 'app-cytoscape-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cytoscape-graph.component.html',
    styleUrls: ['./cytoscape-graph.component.less']
})
export class CytoscapeGraphComponent implements OnChanges, OnInit {

    @Input() elements: any;
    @Input() style;
    @Input() transmissionChainViewType: string;
    @Input() legend: any;

    @Output() nodeTapped = new EventEmitter<any>();
    @Output() edgeTapped = new EventEmitter<any>();
    @Output() viewTypeChanged = new EventEmitter<any>();
    @Output() changeEditMode = new EventEmitter<boolean>();

    cy: any;
    container: string = 'cy';

    Constants = Constants;

    transmissionChainViewTypes$: Observable<any[]>;
    timelineViewType: string = 'horizontal';
    maxTimelineIndex: number = 0;

    // show/hide legend?
    showLegend: boolean = true;
    // toggle edit mode
    editMode: boolean = false;

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
                'text-margin-y': '14px'
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
                'text-margin-y': '14px'
            }
        }
    ];

    showLoading: boolean = true;
    datesArray: string[] = [];
    timelineDatesRanks: any = {};

    timelineNodes: any = [];

    timelineNodesIndexes: any = [];


    constructor(
        private genericDataService: GenericDataService,
        private el: ElementRef
    ) {
    }

    ngOnInit() {
        // initialize style
        this.style =
            this.style ?
                this.style :
                this.defaultStyle;
        // load view types
        this.transmissionChainViewTypes$ = this.genericDataService.getTransmissionChainViewTypes();
        // default to bubble
        if (!this.transmissionChainViewType) {
            this.transmissionChainViewType = Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value;
        }

    }

    public ngOnChanges(): any {
        // render cytoscape object
        this.render();
    }

    /**
     * Render cytoscape graph
     */
    render() {
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
            wheelSensitivity: 0.3,
            ready: () => {
                // show spinner when layout starts to draw
                this.showLoading = true;
            }
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
     * Generate the array of dates to be used on the timeline view
     */
    calculateTimelineDates() {
        // empty the already set timeline and dates arrays
        this.datesArray = [];
        this.timelineDatesRanks = {};

        this.timelineNodes = [];
        const nodes = _.sortBy(this.elements.nodes, 'data.dateTimeline');
        // loop through nodes to extract the dates ( dateTimeline)
        _.forEach(nodes, (node, key) => {
            if (!_.isEmpty(node.data.dateTimeline)) {

                if (this.timelineDatesRanks[node.data.dateTimeline]) {
                    // check if node rank was already calculated
                    if (!this.timelineDatesRanks[node.data.dateTimeline][node.data.id]) {
                        this.setNodeRankDate(node);
                    }
                } else {
                    this.setFirstNodeOnDate(node);

                }
                this.datesArray.push(node.data.dateTimeline);
            }
        });
        this.datesArray = _.uniq(this.datesArray);
        this.datesArray = _.sortBy(this.datesArray);

        console.log(this.timelineDatesRanks);
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
            height: 840
        };
        // canvas dimensions
        const originalHeight = document.getElementById('cy').clientHeight;
        const originalWidth = document.getElementById('cy').clientWidth;

        // calculate scale between server and original width
        const scaleFactor = Math.round(pageSize.width / originalWidth);
        // calculate scale factor based on split factor.
        let scale = scaleFactor * splitFactor;
        // if scale is calculated as 1, default it to 4 for a better quality of the image
        if (scale === 1) {
            scale = 4;
        }

        let png64 = '';
        if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
            || this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
            png64 = this.cy.png({bg: 'white', full: true});
        } else {
            png64 = this.cy.png({bg: 'white', scale: scale});
        }

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

    getNode(nodeId) {
        let foundNode = null;
        _.forEach(this.elements.nodes, (node, key) => {
            if (node.data.id === nodeId) {
                foundNode = node;
            }
        });
        return foundNode;
    }

    getMaxRankDate(dateRanks) {
        let maxRank = 0;
        _.forEach(Object.keys(dateRanks), (dateRank) => {
            if (dateRanks[dateRank] > maxRank) {
                maxRank = dateRanks[dateRank];
            }
        });
        return maxRank;
    }

    setNodeRankDate(node) {
        console.log('set node rank');
        if (node.data.nodeType === 'checkpoint') {
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
            console.log('node is checkpoint');
        } else {
            console.log('node is not checkpoint');

            // get max rank for that date
            const maxRankDate = this.getMaxRankDate(this.timelineDatesRanks[node.data.dateTimeline]);
            console.log(maxRankDate);

            // set rank to max +_1
            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = !maxRankDate ? 0 : maxRankDate + 1;
            // check if the node has related nodes and assign ranks to those as well.
            const relatedNodes = this.getRelatedNodes(node.data.id);
            console.log(relatedNodes);
            _.forEach(relatedNodes, (relatedNode, relatedKey) => {
                let maxRankToBlock = null;
                if (this.timelineDatesRanks[relatedNode.data.dateTimeline]) {
                    // check if node rank was already calculated
                    if (!this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id]) {
                        if (relatedNode.data.nodeType === 'checkpoint') {
                            this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = -1;
                        } else {
                            const maxRankDateRelatedNode = this.getMaxRankDate(this.timelineDatesRanks[relatedNode.data.dateTimeline]);
                            maxRankToBlock = maxRankDateRelatedNode;
                            this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = !maxRankDateRelatedNode ? 0 : maxRankDateRelatedNode + 1;
                        }
                    }
                } else {
                    this.setFirstNodeOnDate(relatedNode);
                    maxRankToBlock = 0;
                }
                console.log('set max rank');
                // block rank on previous dates
                let startDate = moment(node.data.dateTimeline);
                const endDate = moment(relatedNode.data.dateTimeline);
                while (startDate < endDate) {
                    startDate = startDate.add(1, 'days');
                    this.timelineDatesRanks[startDate.format( 'YYYY-MM-DD')]['maxRank'] = maxRankToBlock;
                }


            });
        }
    }

    setFirstNodeOnDate(node) {
        console.log('set node rank first node');
        this.timelineDatesRanks[node.data.dateTimeline] = [];
        if (node.data.nodeType === 'checkpoint') {
            console.log('node is checkpoint - first');

            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
        } else {
            console.log('node is not checkpoint - first');

            this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = 0;
        }
        // check if the node has related nodes and assign ranks to those as well.
        const relatedNodes = this.getRelatedNodes(node.data.id);
        console.log(relatedNodes);

        _.forEach(relatedNodes, (relatedNode, relatedKey) => {
            let maxRankToBlock = null;
            if (this.timelineDatesRanks[relatedNode.data.dateTimeline]) {
                // check if node rank was already calculated
                if (!this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id]) {
                    if (node.data.nodeType === 'checkpoint') {
                        this.timelineDatesRanks[node.data.dateTimeline][node.data.id] = -1;
                    } else {
                        const maxRankDateRelatedNode = this.getMaxRankDate(this.timelineDatesRanks[relatedNode.data.dateTimeline]);
                        maxRankToBlock = maxRankDateRelatedNode;
                        this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = (!maxRankDateRelatedNode) ? maxRankDateRelatedNode : maxRankDateRelatedNode + 1;
                    }
                }

            }  else {
                this.timelineDatesRanks[relatedNode.data.dateTimeline] = [];
                if (relatedNode.data.nodeType === 'checkpoint') {
                    console.log('node is checkpoint - first');

                    this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = -1;
                } else {
                    console.log('node is not checkpoint - first');

                    this.timelineDatesRanks[relatedNode.data.dateTimeline][relatedNode.data.id] = 0;
                }
            }
            console.log('set max rank');
            // block rank on previous dates
            let startDate = moment(node.data.dateTimeline);
            const endDate = moment(relatedNode.data.dateTimeline);
            while (startDate < endDate) {
                startDate = startDate.add(1, 'days');
                if (!this.timelineDatesRanks[startDate.format( 'YYYY-MM-DD')]) {
                    this.timelineDatesRanks[startDate.format( 'YYYY-MM-DD')] = [];
                }
                this.timelineDatesRanks[startDate.format( 'YYYY-MM-DD')]['maxRank'] = maxRankToBlock;
            }


        });
    }

}


