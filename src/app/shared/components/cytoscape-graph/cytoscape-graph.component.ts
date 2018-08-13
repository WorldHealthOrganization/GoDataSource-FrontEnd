import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';


@Component({
    selector: 'app-cytoscape-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cytoscape-graph.component.html',
    styleUrls: ['./cytoscape-graph.component.less']
})
export class CytoscapeGraphComponent implements OnInit {

    @Input() elements;
    @Input() style;

    graphData = {
        nodes: [
            {data: {id: 'j', name: 'Jerry', nodeColor: '#6FB1FC', faveShape: 'triangle'}},
            {data: {id: 'e', name: 'Elaine', nodeColor: '#EDA1ED', faveShape: 'ellipse'}},
            {data: {id: 'k', name: 'Kramer', nodeColor: '#86B342', faveShape: 'octagon'}},
            {data: {id: 'g', name: 'George', nodeColor: '#F5A45D', faveShape: 'rectangle'}},
            {data: {id: 'l', name: 'Larry', nodeColor: '#86B342', faveShape: 'octagon'}},
            {data: {id: 'm', name: 'Mary', nodeColor: '#F5A45D', faveShape: 'rectangle'}},
            {data: {id: 'n', name: 'Nicholas', nodeColor: '#86B342', faveShape: 'octagon'}},
            {data: {id: 'o', name: 'Oliver', nodeColor: '#F5A45D', faveShape: 'rectangle'}}
        ],
        edges: [
            {data: {source: 'j', target: 'e', edgeColor: '#6FB1FC'}},
            {data: {source: 'j', target: 'k', edgeColor: '#6FB1FC'}},
            {data: {source: 'j', target: 'g', edgeColor: '#6FB1FC'}},

            {data: {source: 'e', target: 'k', edgeColor: '#EDA1ED'}},
            {data: {source: 'e', target: 'l', edgeColor: '#EDA1ED'}},
            {data: {source: 'e', target: 'n', edgeColor: '#EDA1ED'}},

            {data: {source: 'g', target: 'n', edgeColor: '#EDA1ED'}},
            {data: {source: 'g', target: 'm', edgeColor: '#EDA1ED'}},
            {data: {source: 'g', target: 'o', edgeColor: '#EDA1ED'}}

        ]
    };

    elem = [ // list of graph elements to start with
        { // node a
            data: { id: 'a' }
        },
        { // node b
            data: { id: 'b' }
        },
        { // edge ab
            data: { id: 'ab', source: 'a', target: 'b' }
        }
    ];

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
                'width': 3,
                'line-color': 'data(edgeColor)',
                'target-arrow-color': 'data(edgeColor)',
                'target-arrow-shape': 'triangle'
            }
        }
    ];

    constructor() {}

    ngOnInit() {
        // initialize style
        const graphStyle = this.style ? this.style : this.defaultStyle;
        // initialize cytoscape object
        const cy = cytoscape({
            container: document.getElementById('cy'), // container to render in
            elements: this.graphData,
            style: graphStyle,
            layout: {
                name: 'breadthfirst',
                rows: 3
            }
        });
    }

}


