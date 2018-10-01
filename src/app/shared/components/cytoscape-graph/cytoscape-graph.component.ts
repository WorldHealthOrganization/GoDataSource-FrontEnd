import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';
import * as cola from 'cytoscape-cola';
import * as dagre from 'cytoscape-dagre';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { Constants } from '../../../core/models/constants';
import * as _ from 'lodash';

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

    cy: any;
    container: string = 'cy';

    Constants = Constants;

    transmissionChainViewTypes$: Observable<any[]>;

    objectKeys = Object.keys;
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
            // restrict position of the node on the x axis for the timeline view
            const nodeData = node.json().data;
            // calculate position on x axis based on the index of the date.
            const datesIndex = _.findIndex(
                this.datesArray,
                function (o) {
                    return o === nodeData.dateTimeline;
                });
            // using 150px as it looks fine
            const posX = datesIndex * 150;
            // calculate position on y axis based on the index of the node from that respective date
            if (!_.isEmpty(nodeData.dateTimeline)) {
                const nodesArray = this.timelineDates[nodeData.dateTimeline];
                let nodeIndex = 1;
                if (nodesArray.length > 1) {
                    nodeIndex = _.findIndex(
                        nodesArray,
                        function (n) {
                            return n === nodeData.id;
                        });
                }
                // using 100 px as it looks fine
                const posY = (nodeIndex % 2 === 0) ? (nodeIndex - 1) * 100 : (nodeIndex - 1) * 100 * -1;
                return {x: posX, y: posY};
            }
        }
    };

    // selected layout
    layout: any;

    defaultZoom: any = {
        min: 0.1,
        max: 4
    };

    // the stylesheet for the graph
    defaultStyle: any = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
                'color': 'data(nodeNameColor)',
                'label': 'data(name)'
            }
        },
        {
            selector: 'edge',
            style: {
                'line-color': 'data(edgeColor)',
                'target-arrow-color': 'data(edgeColor)',
                'target-arrow-shape': 'triangle'
            }
        }
    ];

    // the style for the timeline view. The label field is modified in order to display dateTimeline
    timelineStyle: any = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
                'color': 'data(nodeNameColor)',
                'label': 'data(label)',
                'text-wrap': 'wrap',
                'display': 'data(displayTimeline)'
            }
        },
        {
            selector: 'edge',
            style: {
                'line-color': 'data(edgeColor)',
                'target-arrow-color': 'data(edgeColor)',
                'target-arrow-shape': 'triangle'
            }
        }
    ];

    showLoading: boolean = true;
    datesArray: string[] = [];
    timelineDates: any = {};

    constructor(
        private genericDataService: GenericDataService,
        private el: ElementRef
    ) {}

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
        this.timelineDates = {};
        this.datesArray = [];
        // loop through nodes to extract the dates ( dateTimeline)
        _.forEach(this.elements.nodes, (node, key) => {
            if (!_.isEmpty(node.data.dateTimeline)) {
                if (this.timelineDates[node.data.dateTimeline]) {
                    this.timelineDates[node.data.dateTimeline].push(node.data.id);
                } else {
                    this.timelineDates[node.data.dateTimeline] = [];
                    this.timelineDates[node.data.dateTimeline].push(node.data.id);
                }
                this.datesArray.push(node.data.dateTimeline);
            }
        });
        this.datesArray = _.uniq(this.datesArray);
        this.datesArray = _.sortBy(this.datesArray);
    }

    /**
     * re-render the layout on view type change
     */
    updateView($event) {
        this.transmissionChainViewType = $event;
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
        } else if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value) {
            this.calculateTimelineDates();
            this.style = this.timelineStyle;
            this.layout = this.layoutPreset;
        }
    }

    showCaseNodesWithoutDates() {
       return (
           this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
           && this.elements
           && this.elements.caseNodesWithoutDates.length
       );
    }

    showContactNodesWithoutDates() {
        return (
            this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
            && this.elements
            && this.elements.contactNodesWithoutDates.length
        );
    }
    showEventNodesWithoutDates() {
        return (
            this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
            && this.elements
            && this.elements.eventNodesWithoutDates.length
        );
    }
}


