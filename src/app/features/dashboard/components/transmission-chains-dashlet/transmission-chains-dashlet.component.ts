import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import { Constants } from '../../../../core/models/constants';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';

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
    filters: any = {};
    caseClassificationsList$: Observable<any[]>;
    genderList$: Observable<any[]>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {}

    ngOnInit() {
        // init filters
        this.filters.showContacts = false;
        this.filters.showEvents = true;

        this.genderList$ = this.genericDataService.getGenderList();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

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
            console.log(this.filters);

            const requestQueryBuilder = new RequestQueryBuilder();
            // create queryBuilder for filters
           if (this.filters) {
               requestQueryBuilder.filter.remove('gender');
               requestQueryBuilder.filter.remove('occupation');

               const conditions: any =  {};
               // create conditions based on filters
               // occupation
               if ( !_.isEmpty(this.filters.occupation) ) {
                    conditions['occupation'] = { regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.occupation) + '/i' };
               }
               // gender
               if ( !_.isEmpty(this.filters.gender) ) {
                   conditions['gender'] =  { inq:  this.filters.gender};
               }
               // case classification
               if ( !_.isEmpty(this.filters.classification) ) {
                   conditions['classification'] = this.filters.classification;
               }
               // case classification
               if ( !_.isEmpty(this.filters.locationId) ) {
                   conditions['addresses.locationId'] = this.filters.locationId;
               }
               // firstName
               if ( !_.isEmpty(this.filters.firstName) ) {
                   conditions['firstName'] = { regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.firstName) + '/i' };
               }
               // lastName
               if ( !_.isEmpty(this.filters.lastName) ) {
                   conditions['lastName'] = { regexp: '/^' + RequestFilter.escapeStringForRegex(this.filters.lastName) + '/i' };
               }
               // age start
               if ( !_.isEmpty(this.filters.age) ) {
                   console.log(this.filters.age);
             //      conditions['age'] =  { between:  [ this.filters.age};
               }
               // age end
               if ( !_.isEmpty(this.filters.gender) ) {
                   conditions['gender'] =  { inq:  this.filters.gender};
               }
               // gender
               if ( !_.isEmpty(this.filters.gender) ) {
                   conditions['gender'] =  { inq:  this.filters.gender};
               }
               // gender
               if ( !_.isEmpty(this.filters.gender) ) {
                   conditions['gender'] =  { inq:  this.filters.gender};
               }


              requestQueryBuilder.filter.where({
                  person: {
                      where: conditions
                  }
              });

           }

            this.filters.filtersDefault = this.filtersDefault();
            this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id, requestQueryBuilder).subscribe((chains) => {
                console.log(chains);
                if ( !_.isEmpty(chains) ) {
                    this.graphElements = this.transmissionChainDataService.convertChainToGraphElements(chains, this.filters);
                } else {
                    this.graphElements = [];
                }

            // Load the graph for tests
            //    this.loadGraphWithNodesAndEdges(400);

            });
        }
    }

    /**
     * Handle tap on a node
     * @param {GraphNodeModel} entity
     * @returns {IterableIterator<any>}
     */
     onNodeTap(entity: GraphNodeModel) {
        // retrieve Case/Event/Contact information
        this.entityDataService
            .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
            .catch((err) => {
                // show error message
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((entityData: CaseModel|EventModel|ContactModel) => {
                // show dialog with data
                const dialogData = this.entityDataService.getLightObjectDisplay(entityData);
                this.dialogService.showDataDialog(dialogData);
            });
    }

    /**
     * refresh chain data based on filters
     */
    refreshChain() {
        this.displayChainsOfTransmission();
    }

    /**
     * used to determine if filters are used. If not, we can load the graph faster
     * @returns {boolean}
     */
    filtersDefault(): boolean {
        return ( this.filters.showEvents && !this.filters.showContacts && _.isEmpty(this.filters.classification) && _.isEmpty(this.filters.gender) && _.isEmpty(this.filters.occupation) );
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


