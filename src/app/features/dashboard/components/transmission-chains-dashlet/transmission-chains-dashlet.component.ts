import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-dashlet.component.html',
    styleUrls: ['./transmission-chains-dashlet.component.less']
})
export class TransmissionChainsDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    graphElements: any;
    Constants = Constants;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService
    ) {}

    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                this.displayChainsOfTransmission();
            });
    }

    /**
     * Display chains of transmission
     */
    displayChainsOfTransmission() {
        if ( this.selectedOutbreak) {
            this.transmissionChainDataService.getTransmissionChainsList(this.selectedOutbreak.id).subscribe((chains) => {

                this.graphElements = chains[0].convertChainToGraphElements();

                // Load the graph for tests
            //    this.loadGraphWithNodesAndEdges(400);

            });
        }
    }

    /**
     * Load the graph for tests
     * @param {number} maxNodes
     */
    loadGraphWithNodesAndEdges(maxNodes: number) {
        for ( var i = 0; i < maxNodes; i++) {
            this.graphElements.nodes.push({data: new GraphNodeModel({id: i, name: i})});

            if ( i < maxNodes - 4) {
                this.graphElements.edges.push({data: new GraphEdgeModel({source: i, target: i + 1})});
                if ( i % 2 === 0) {
                    this.graphElements.edges.push({data: new GraphEdgeModel({source: i, target: i + 2})});
                }
                this.graphElements.edges.push({data: new GraphEdgeModel({source: i, target: i + 3})});
            }
        }
    }

}


