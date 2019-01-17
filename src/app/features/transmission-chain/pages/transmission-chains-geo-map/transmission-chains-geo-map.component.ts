import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel, TransmissionChainRelation } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { WorldMapMarker, WorldMapMarkerType, WorldMapPath, WorldMapPoint } from '../../../../shared/components/world-map/world-map.component';
import * as _ from 'lodash';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { EntityModel } from '../../../../core/models/entity.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Subscription } from 'rxjs/Subscription';
import { Constants } from '../../../../core/models/constants';

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

    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private transmissionChainDataService: TransmissionChainDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {}

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
                this.transmissionChainDataService.getIndependentTransmissionChainsList(this.selectedOutbreak.id)
            ]).catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            }).subscribe(([personTypes, certaintyLevels, chainsData]: [ReferenceDataCategoryModel, ReferenceDataCategoryModel, TransmissionChainModel[]]) => {
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

                // reset data
                const markersMap = {};
                this.markers = [];
                this.lines = [];

                // add valid address to marked
                const addValidAddressToMarker = (
                    address: AddressModel,
                    chainIndex: number,
                    markerId: string,
                    type: string
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

                    // add marker
                    this.markers.push(new WorldMapMarker({
                        point: new WorldMapPoint(
                            address.geoLocation.lat,
                            address.geoLocation.lng
                        ),
                        type: WorldMapMarkerType.CIRCLE,
                        color: typeToColorMap[type] ? typeToColorMap[type] : Constants.DEFAULT_COLOR_CHAINS
                    }));

                    // add marker to map list
                    _.set(markersMap, `[${chainIndex}][${markerId}]`, this.markers.length - 1);
                };

                // go though each chain and create relevant markers
                _.each(chainsData, (chain: TransmissionChainModel, chainIndex: number) => {
                    // create markers
                    _.each(chain.nodes, (node: EntityModel) => {
                        switch (node.type) {
                            // events
                            case EntityType.EVENT:
                                addValidAddressToMarker(
                                    (node.model as EventModel).address,
                                    chainIndex,
                                    node.model.id,
                                    node.type
                                );
                                break;

                            // contacts ( same as case )
                            case EntityType.CONTACT:
                                addValidAddressToMarker(
                                    _.find(
                                        (node.model as ContactModel).addresses,
                                        {
                                            typeId: AddressType.CURRENT_ADDRESS
                                        }
                                    ),
                                    chainIndex,
                                    node.model.id,
                                    node.type
                                );
                                break;

                            // cases ( same as contact )
                            case EntityType.CASE:
                                addValidAddressToMarker(
                                    _.find(
                                        (node.model as CaseModel).addresses,
                                        {
                                            typeId: AddressType.CURRENT_ADDRESS
                                        }
                                    ),
                                    chainIndex,
                                    node.model.id,
                                    node.type
                                );
                                break;
                        }
                    });

                    // map relationships
                    const personsToRelationshipMap = {};
                    console.log(chain.relationships);
                    // _.each(chain.relationships, (relationship))

                    // connect markers
                    console.log(chain);
                    _.each(chain.chainRelations, (rel: TransmissionChainRelation) => {
                        // check if we have markers for relation records
                        if (
                            markersMap[chainIndex][rel.entityIds[0]] !== undefined &&
                            markersMap[chainIndex][rel.entityIds[1]] !== undefined
                        ) {
                            this.lines.push(new WorldMapPath({
                                points: [
                                    this.markers[markersMap[chainIndex][rel.entityIds[0]]].point,
                                    this.markers[markersMap[chainIndex][rel.entityIds[1]]].point
                                ],
                                // color: certaintyLevelToColorMap[type] ? certaintyLevelToColorMap[type] : Constants.DEFAULT_COLOR_CHAINS
                            }));
                        }
                    });
                });

                // finished loading data
                this.displayLoading = false;
            });
        }
    }
}
