import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel, TransmissionChainRelation } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { } from '@types/googlemaps';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { EntityModel } from '../../../../core/models/entity.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { AddressModel } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-transmission-chains-geo-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-geo-map.component.html',
    styleUrls: ['./transmission-chains-geo-map.component.less']
})
export class TransmissionChainsGeoMapComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE', '/transmission-chains'),
        new BreadcrumbItemModel('LNG_PAGE_TRANSMISSION_CHAINS_GEO_MAP_TITLE', '', true)
    ];

    markers: google.maps.Marker[] = [];
    lines: google.maps.Polyline[] = [];

    selectedGeoPoint: google.maps.LatLng;

    displayLoading: boolean = true;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private transmissionChainDataService: TransmissionChainDataService
    ) {}

    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.reloadChains();
            });
    }

    /**
     * Re(load) the Transmission Chains list, based on the applied filter, sort criterias
     */
    reloadChains() {
        if (this.selectedOutbreak) {
            // display loading
            this.displayLoading = true;

            // load independent chains
            this.transmissionChainDataService
                .getIndependentTransmissionChainsList(
                    this.selectedOutbreak.id
                )
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe((chainsData: TransmissionChainModel[]) => {
                    // reset data
                    const markersMap = {};
                    this.markers = [];
                    this.lines = [];
                    this.selectedGeoPoint = null;

                    // add valid address to marked
                    const addValidAddressToMarker = (
                        address: AddressModel,
                        chainIndex: number,
                        markerId: string
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
                        this.markers.push(new google.maps.Marker({
                            position: new google.maps.LatLng(
                                address.geoLocation.lat as number,
                                address.geoLocation.lng as number
                            )
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
                                        node.model.id
                                    );
                                    break;

                                // contacts ( same as case )
                                case EntityType.CONTACT:
                                    addValidAddressToMarker(
                                        _.find(
                                            (node.model as ContactModel).addresses,
                                            {
                                                typeId: Constants.ADDRESS_USUAL_PLACE_OF_RESIDENCE
                                            }
                                        ),
                                        chainIndex,
                                        node.model.id
                                    );
                                    break;

                                // cases ( same as contact )
                                case EntityType.CASE:
                                    addValidAddressToMarker(
                                        _.find(
                                            (node.model as CaseModel).addresses,
                                            {
                                                typeId: Constants.ADDRESS_USUAL_PLACE_OF_RESIDENCE
                                            }
                                        ),
                                        chainIndex,
                                        node.model.id
                                    );
                                    break;
                            }
                        });

                        // connect markers
                        _.each(chain.chainRelations, (rel: TransmissionChainRelation) => {
                            // check if we have markers for relation records
                            if (
                                markersMap[chainIndex][rel.entityIds[0]] !== undefined &&
                                markersMap[chainIndex][rel.entityIds[1]] !== undefined
                            ) {
                                this.lines.push(new google.maps.Polyline({
                                    path: [
                                        this.markers[markersMap[chainIndex][rel.entityIds[0]]].getPosition(),
                                        this.markers[markersMap[chainIndex][rel.entityIds[1]]].getPosition()
                                    ]
                                } as google.maps.PolylineOptions));
                            }
                        });
                    });

                    // finished loading data
                    this.displayLoading = false;
                });
        }
    }
}