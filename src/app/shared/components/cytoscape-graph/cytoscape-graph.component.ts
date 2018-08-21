import { Component, ElementRef, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
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

    tempElements: any;
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

    showLoading: boolean = true;

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
        if ( _.isEmpty(this.tempElements) ) {
            this.tempElements = _.cloneDeep(this.elements);
        }
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
            if ( this.tempElements ) {
                this.elements.edges = this.tempElements.edges;
            }
        } else if (this.transmissionChainViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.HIERARCHICAL_NETWORK.value) {
            cytoscape.use(dagre);
            this.layout = this.layoutDagre;
            // if hierarchical view - display only one incoming edge per node.
            if ( this.tempElements ) {
                this.elements.edges = this.tempElements.edgesHierarchical;
            }
        }
    }

}


