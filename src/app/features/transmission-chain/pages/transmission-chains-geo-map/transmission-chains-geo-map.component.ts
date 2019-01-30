import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import {
    WorldMapMarker,
    WorldMapMarkerType,
    WorldMapPath,
    WorldMapPathType,
    WorldMapPoint
} from '../../../../shared/components/world-map/world-map.component';
import * as _ from 'lodash';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { EntityModel } from '../../../../core/models/entity.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import {
    ReferenceDataCategory,
    ReferenceDataCategoryModel,
    ReferenceDataEntryModel
} from '../../../../core/models/reference-data.model';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Subscription } from 'rxjs/Subscription';
import { Constants } from '../../../../core/models/constants';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';

@Component({
    selector: 'app-transmission-chains-geo-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-geo-map.component.html',
    styleUrls: ['./transmission-chains-geo-map.component.less']
})
export class TransmissionChainsGeoMapComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', '/transmission-chains'),
        new BreadcrumbItemModel('LNG_PAGE_TRANSMISSION_CHAINS_GEO_MAP_TITLE', '', true)
    ];

    markers: WorldMapMarker[] = [];
    lines: WorldMapPath[] = [];

    displayLoading: boolean = true;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // constants
    ReferenceDataCategory = ReferenceDataCategory;

    // subscribers
    outbreakSubscriber: Subscription;

    // display labels
    displayLabels: boolean = true;

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private transmissionChainDataService: TransmissionChainDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.reloadChains();
            });
    }

    /**
     * Component removed
     */
    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Re(load) the Transmission Chains list, based on the applied filter, sort criterias
     */
    reloadChains() {
        if (this.selectedOutbreak) {
            // display loading
            this.displayLoading = true;

            // retrieve chin data & person colors
            return Observable.forkJoin([
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE),
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CERTAINTY_LEVEL),
                this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION),
                this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id)
            ]).catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            }).subscribe(([
                personTypes,
                certaintyLevels,
                caseClassification,
                chainsData
            ]: [
                ReferenceDataCategoryModel,
                ReferenceDataCategoryModel,
                ReferenceDataCategoryModel,
                TransmissionChainModel[]
            ]) => {
                // retrieve graph data
                const graphData = this.transmissionChainDataService.convertChainToGraphElements(
                    chainsData, {
                        showEvents: true,
                        showContacts: true
                    }, {
                    }, []
                );

                // determine map nodes
                if (
                    !_.isEmpty(chainsData) &&
                    !_.isEmpty(graphData)
                ) {
                    // map colors to types
                    const typeToColorMap = {};
                    _.each(personTypes.entries, (entry: ReferenceDataEntryModel) => {
                        typeToColorMap[entry.id] = entry.colorCode;
                    });

                    // map certainty level to color
                    const certaintyLevelToColorMap = {};
                    _.each(certaintyLevels.entries, (entry: ReferenceDataEntryModel) => {
                        certaintyLevelToColorMap[entry.id] = entry.colorCode;
                    });

                    // map case classification to color
                    const caseClassificationToColorMap = {};
                    _.each(caseClassification.entries, (entry: ReferenceDataEntryModel) => {
                        caseClassificationToColorMap[entry.id] = entry.colorCode;
                    });

                    // reset data
                    const markersMap: {
                        [idEntityModel: string]: WorldMapMarker
                    } = {};
                    this.markers = [];
                    this.lines = [];

                    // add valid address to marked
                    const addValidAddressToMarker = (
                        address: AddressModel,
                        entity: EntityModel,
                        gNode: { data: GraphNodeModel }
                    ) => {
                        // validate address
                        if (
                            _.isEmpty(address) ||
                            _.isEmpty(address.geoLocation) ||
                            !_.isNumber(address.geoLocation.lat) ||
                            !_.isNumber(address.geoLocation.lng)
                        ) {
                            return;
                        }

                        // create marker
                        const marker: WorldMapMarker = new WorldMapMarker({
                            point: new WorldMapPoint(
                                address.geoLocation.lat,
                                address.geoLocation.lng
                            ),
                            type: WorldMapMarkerType.CIRCLE,
                            color: typeToColorMap[entity.type] ? typeToColorMap[entity.type] : Constants.DEFAULT_COLOR_CHAINS,
                            label: gNode.data.name,
                            labelColor: (entity.model as CaseModel).classification && caseClassificationToColorMap[(entity.model as CaseModel).classification] ?
                                caseClassificationToColorMap[(entity.model as CaseModel).classification] :
                                Constants.DEFAULT_COLOR_CHAINS,
                        });

                        // add marker
                        this.markers.push(marker);

                        // add marker to map list
                        markersMap[entity.model.id] = marker;
                    };

                    // go through nodes that are rendered on COT graph and determine what we can render on geo-map
                    const firstChain: TransmissionChainModel = chainsData[0];
                    _.each(graphData.nodes, (gNode: { data: GraphNodeModel }) => {
                        // get case / contact / event ...
                        const entity: EntityModel = firstChain.nodes[gNode.data.id];
                        if (!_.isEmpty(entity)) {
                            switch (entity.type) {
                                // events
                                case EntityType.EVENT:
                                    addValidAddressToMarker(
                                        (entity.model as EventModel).address,
                                        entity,
                                        gNode
                                    );
                                    break;

                                // contacts ( same as case )
                                case EntityType.CONTACT:
                                    addValidAddressToMarker(
                                        _.find(
                                            (entity.model as ContactModel).addresses,
                                            {
                                                typeId: AddressType.CURRENT_ADDRESS
                                            }
                                        ),
                                        entity,
                                        gNode
                                    );
                                    break;

                                // cases ( same as contact )
                                case EntityType.CASE:
                                    addValidAddressToMarker(
                                        _.find(
                                            (entity.model as CaseModel).addresses,
                                            {
                                                typeId: AddressType.CURRENT_ADDRESS
                                            }
                                        ),
                                        entity,
                                        gNode
                                    );
                                    break;
                            }
                        }
                    });

                    // map relationships
                    const relationshipMap: {
                        [idRelationship: string]: RelationshipModel
                    } = {};
                    _.each(firstChain.relationships, (relationship: RelationshipModel) => {
                        relationshipMap[relationship.id] = relationship;
                    });

                    // render relationships
                    _.each(graphData.edges, (gEdge: { data: GraphEdgeModel }) => {
                        // render relation
                        const relationship: RelationshipModel = relationshipMap[gEdge.data.id];
                        if (
                            !_.isEmpty(relationship) &&
                            markersMap[gEdge.data.source] &&
                            markersMap[gEdge.data.target]
                        ) {
                            this.lines.push(new WorldMapPath({
                                points: [
                                    markersMap[gEdge.data.source].point,
                                    markersMap[gEdge.data.target].point
                                ],
                                color: certaintyLevelToColorMap[relationship.certaintyLevelId] ? certaintyLevelToColorMap[relationship.certaintyLevelId] : Constants.DEFAULT_COLOR_CHAINS,
                                type: WorldMapPathType.ARROW
                            }));
                        }
                    });
                }

                // finished loading data
                this.displayLoading = false;
            });
        }
    }
}
