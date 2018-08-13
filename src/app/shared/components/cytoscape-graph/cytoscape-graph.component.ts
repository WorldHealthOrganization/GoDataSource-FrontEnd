import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';
import * as coseBilkent from 'cytoscape-cose-bilkent';


@Component({
    selector: 'app-cytoscape-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cytoscape-graph.component.html',
    styleUrls: ['./cytoscape-graph.component.less']
})
export class CytoscapeGraphComponent implements OnChanges {

    @Input() elements: any;
    @Input() style;

    cy: any;
    container: string = 'cy';
    layout: any = {name: 'cose-bilkent'};
    zoom: any = {
        min: 0.5,
        max: 1.8
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

    constructor() {
        // initialize style
        this.style =
            this.style ?
                this.style :
                this.defaultStyle;
        // use the coseBilkent layout
        cytoscape.use(coseBilkent);
    }

    public ngOnChanges(): any {
        // render cytoscape object
        this.render();
    }

    /**
     * Render cytoscape graph
     */
    public render() {
        this.cy = cytoscape({
            container: document.getElementById(this.container),
            layout: this.layout,
            style: this.style,
            elements: this.elements,
            minZoom: this.zoom.min,
            maxZoom: this.zoom.max
        });
    }

}


