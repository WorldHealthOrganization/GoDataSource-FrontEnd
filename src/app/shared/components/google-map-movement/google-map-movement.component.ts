import { Component, Input, ViewEncapsulation } from '@angular/core';
import { AddressModel } from '../../../core/models/address.model';
import * as _ from 'lodash';
import * as moment from 'moment';
import { } from '@types/googlemaps';

@Component({
    selector: 'app-google-map-movement',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './google-map-movement.component.html',
    styleUrls: ['./google-map-movement.component.less']
})
export class GoogleMapMovementComponent {
    @Input() width: string = '100%';
    @Input() height: string = '400px';

    markers: google.maps.Marker[] = [];
    arrowLines: google.maps.Polyline[] = [];

    selectedGeoPoint: google.maps.LatLng;

    private _addresses: AddressModel[] = [];
    @Input() set addresses(items: AddressModel[]) {
        // init
        this.markers = [];
        this.arrowLines = [];

        // line simbold
        const lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        // sort addresses
        let previousAddress: AddressModel;
        this._addresses = _.chain(items).filter((item: AddressModel) => {
            return item.geoLocation &&
                _.isNumber(item.geoLocation.lat) &&
                _.isNumber(item.geoLocation.lng);
        }).sortBy((item: AddressModel) => {
            return moment(item.date);
        }).map((item, index) => {
            // add marker
            this.markers.push(new google.maps.Marker({
                position: new google.maps.LatLng(
                    item.geoLocation.lat as number,
                    item.geoLocation.lng as number
                ),
                label: (index + 1).toString()
            }));

            // add arrow line
            const currentAddress = new AddressModel(item);
            if (index > 0) {
                this.arrowLines.push(new google.maps.Polyline({
                    path: [{
                        lat: previousAddress.geoLocation.lat,
                        lng: previousAddress.geoLocation.lng
                    }, {
                        lat: currentAddress.geoLocation.lat,
                        lng: currentAddress.geoLocation.lng
                    }],
                    icons: [{
                        icon: lineSymbol,
                        offset: '100%'
                    }]
                } as google.maps.PolylineOptions));
            }

            // return address item
            previousAddress = currentAddress;
            return currentAddress;
        }).value();
    }
    get addresses(): AddressModel[] {
        return this._addresses;
    }

    gotoLocation(index: number) {
        this.selectedGeoPoint = this.markers[index].getPosition();
    }
}
