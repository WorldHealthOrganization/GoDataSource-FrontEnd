import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { Constants } from '../../../../core/models/constants';
import * as _ from 'lodash';
import { RelationshipPersonModel } from '../../../../core/models/relationship.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton } from '../../../../shared/components';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ContactModel } from '../../../../core/models/contact.model';

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
        private transmissionChainDataService: TransmissionChainDataService,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
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
            this.transmissionChainDataService.getIndependentTransmissionChainsList(this.selectedOutbreak.id).subscribe((chains) => {

                if ( !_.isEmpty(chains) ) {
                    this.graphElements = chains[0].convertChainToGraphElements();
                } else {
                    this.graphElements = [];
                }

            // Load the graph for tests
            //    this.loadGraphWithNodesAndEdges(400);

            });
        }
    }

    /**
     *  Handle tap on a node
      * @param entity
     */
    onNodeTap(entity: {type: EntityType, id: string}) {
        // retrieve Case/Event/Contact information
        this.entityDataService
            .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
            .catch((err) => {
                // show error message
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((entityData: CaseModel|EventModel|ContactModel) => {

                const dialogData = this.entityDataService.getLightObjectDisplay(entityData);
                this.dialogService.showDataDialog(dialogData);

            });
    }

    /**
     * Load the graph for tests
     * @param {number} maxNodes
     */
    loadGraphWithNodesAndEdges(maxNodes: number) {
        for ( let i = 0; i < maxNodes; i++) {
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


