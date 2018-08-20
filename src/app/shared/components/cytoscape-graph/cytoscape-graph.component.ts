import { Component, ElementRef, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import * as cytoscape from 'cytoscape';
// import * as coseBilkent from 'cytoscape-cose-bilkent';

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
    /**
     * different layouts used for tests
     */
    // layout: any = {name: 'cose-bilkent'};
    // layout: any = {
    //      name: 'breadthfirst',
    //      stop:  () => {
    //                  this.showLoading = false;
    //                  this.cy.zoom( this.cy.minZoom());
    //                  this.cy.fit();
    //              }
    //  };
    layout: any = {
        name: 'cose',
        fit: true,
        padding: 30,
        randomize: false,
        coolingFactor: 0.99,
        spacingFactor: 1.75,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false,
        animate: false,
        stop:  () => {
            this.showLoading = false;
            this.cy.zoom( this.cy.minZoom());
            this.cy.fit();
        }
    };
    zoom: any = {
        min: 0.2,
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

    constructor(private el: ElementRef) {
        // initialize style
        this.style =
            this.style ?
                this.style :
                this.defaultStyle;

        // use the custom layout - for tests
   //     cytoscape.use( dagre );
    }

    public ngOnChanges(): any {
        // render cytoscape object
        this.render();
    }

    /**
     * Render cytoscape graph
     */
    public render() {
        const nativeElement = this.el.nativeElement;
        const container = nativeElement.getElementsByClassName(this.container);

        this.cy = cytoscape({
            container: container[0],
            layout: this.layout,
            style: this.style,
            elements: this.elements,
            minZoom: this.zoom.min,
            maxZoom: this.zoom.max
        });

    }

}


