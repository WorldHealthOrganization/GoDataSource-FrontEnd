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

    @Output() nodeTapped = new EventEmitter<any>();

    cy: any;
    container: string = 'cy';

    transmissionChainViewTypes$: Observable<any[]>;

    /**
     *  layout cola - bubble view
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
     *  layout dagre - tree
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
        ranker: undefined, // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
        // transform: function( node, pos ) { return pos; },
        minLen: function (edge) {
            return 1;
        }, // number of ranks to keep between the source and target of the edge
        edgeWeight: function (edge) {
            return 1;
        }, // higher weight edges are generally made shorter and straighter than lower weight edges
        stop: () => {
            this.showLoading = false;
            if (this.cy) {
                this.cy.fit();
            }
        }
    };

    /**
     *  layout cola - timeline
     */
    layoutPreset1: any = {
        name: 'cola',
        fit: true,
     //   flow: {axis: 'y', minSeparation: 30},
        padding: 10,
        nodeDimensionsIncludeLabels: true,
        maxSimulationTime: 3000,
        avoidOverlap: true,
        unconstrIter: 10,
        userConstIter: 20,
        stop: () => {
            this.showLoading = false;
            if (this.cy) {
                this.cy.fit();
            }
        },
        alignment: ( node ) =>  {
            // restrict position of the node on the x axis for the timeline view
            const nodeData = node.json().data;
            const datesIndex = _.findIndex(
                this.datesArray,
                function (o) {
                    return o === nodeData.dateOfReporting;
                });
            console.log(nodeData);
            console.log(nodeData.dateOfReporting);
            console.log(datesIndex);
            const restrictedPos = datesIndex * 100;
            console.log(restrictedPos);
            return { x: restrictedPos };
        }
    };

    layoutPreset: any = {
        name: 'preset',
        fit: true,
        randomize: true,
        //   flow: {axis: 'y', minSeparation: 30},
        padding: 10,
        nodeDimensionsIncludeLabels: true,
        maxSimulationTime: 3000,
        avoidOverlap: true,
        unconstrIter: 10,
        userConstIter: 20,
        stop: () => {
            this.showLoading = false;
            if (this.cy) {
                this.cy.fit();
            }
        },
        positions: ( node ) =>  {
            // restrict position of the node on the x axis for the timeline view
            const nodeData = node.json().data;
            const datesIndex = _.findIndex(
                this.datesArray,
                function (o) {
                    return o === nodeData.dateOfReporting;
                });
            const posX = datesIndex * 150;
            const nodesArray = this.timelineDates[nodeData.dateOfReporting];
            let nodeIndex = 2;
            if ( nodesArray.length > 1 ) {
                nodeIndex = _.findIndex(
                    nodesArray,
                    function ( n ) {
                        return n === nodeData.id;
                    });
            }
            const posY = (nodeIndex % 2 === 0) ? ( nodeIndex  ) * 100 : ( nodeIndex  ) * 100 * -1;
            return { x: posX, y: posY };
        }
    };

    // selected layout
    layout: any;

    defaultZoom: any = {
        min: 0.1,
        max: 4
    };

    defaultStyle: any = [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
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

    timelineStyle: any = [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': 'data(nodeColor)',
                'label': 'data(label)',
                'text-wrap': 'wrap'
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
    timelinePositions: any;
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
        // add tap event
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            this.nodeTapped.emit(node.json().data);
        });

    }

    /**
     * Generate the array of dates to be used on the timeline view
     */
    calculateDates() {
        _.forEach( this.elements.nodes, (node, key) => {
            const nodeData = node.data;
            console.log(nodeData.id);
            if ( this.timelineDates[node.data.dateOfReporting] ) {
                this.timelineDates[node.data.dateOfReporting].push(node.data.id);
            } else {
                this.timelineDates[node.data.dateOfReporting] = [];
                this.timelineDates[node.data.dateOfReporting].push(node.data.id);
            }

            this.datesArray.push(node.data.dateOfReporting);

        });
        console.log(this.timelineDates);
        this.datesArray = _.uniq(this.datesArray);
        this.datesArray = _.sortBy(this.datesArray);
        // console.log(this.datesArray);

        // _.forEach( this.elements.nodes, (node, key) => {
        //     const datesIndex = _.findIndex(
        //         this.datesArray,
        //         function (o) {
        //             return o === node.data.dateOfReporting;
        //         });
        //
        //
        //     const pos = { x: datesIndex * 100 };
        //     this.timelineStyle.node.data.id = pos;
        //
        // });

    }

    /**
     * re-render the layout on view type change
     */
    updateView() {
        this.render();
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
            this.calculateDates();
            cytoscape.use(cola);
            this.style = this.timelineStyle;
            this.layout = this.layoutPreset;
        }
    }

}


