import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { } from '@types/googlemaps';
import * as _ from 'lodash';

@Component({
    selector: 'app-google-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './google-map.component.html',
    styleUrls: ['./google-map.component.less']
})
export class GoogleMapComponent {
    @Input() width: string = '100%';
    @Input() height: string = '400px';
    @Input() zoom: number = 10;
    @Input() mapType: google.maps.MapTypeId = google.maps.MapTypeId.HYBRID;
    @Input() fitMapOnMarkersChange: boolean = false;

    private markerBounds: google.maps.LatLngBounds;
    private _centerLocation: google.maps.LatLng;
    private _markers: google.maps.Marker[] = [];
    private _lines: google.maps.Polyline[] = [];

    @Input() set centerLocation(value: any) {
        this._centerLocation = value;
        this.refreshMapCenter();
    }
    get centerLocation(): any {
        return this._centerLocation;
    }

    @Input() set markers(markers: google.maps.Marker[]) {
        // clear map markers
        this.clearMarkers();

        // set the new markers
        this._markers = markers;

        // init map markers
        this.setMarkers();
    }
    get markers(): google.maps.Marker[] {
        return this._markers;
    }

    @Input() set lines(lines: google.maps.Polyline[]) {
        // clear map lines
        this.clearLines();

        // set the new lines
        this._lines = lines;

        // init map lines
        this.setLines();
    }
    get lines(): google.maps.Polyline[] {
        return this._lines;
    }

    // map html element ref
    @ViewChild('googleMap') googleMapElement: ElementRef;

    // google map handler
    map: google.maps.Map;

    /**
     * Refresh map center
     */
    private refreshMapCenter() {
        if (
            this.map &&
            this.centerLocation
        ) {
            // set position
            this.map.setCenter(this.centerLocation);

            // zoom
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(this.centerLocation);
            this.map.fitBounds(bounds);
        }
    }

    /**
     * Clear markers
     */
    private clearMarkers() {
        if (this.map) {
            _.each(this._markers, (marker: google.maps.Marker) => {
                marker.setMap(null);
            });
        }
    }

    /**
     * Set markers
     */
    private setMarkers() {
        if (this.map) {
            // set markers
            this.markerBounds = new google.maps.LatLngBounds();
            _.each(this._markers, (marker: google.maps.Marker) => {
                marker.setMap(this.map);
                this.markerBounds.extend(marker.getPosition());
            });

            // fit map bounds
            if (this.fitMapOnMarkersChange) {
                this.fitMarkerBounds();
            }
        }
    }

    /**
     * Zoom in / out & center to view all markers
     */
    public fitMarkerBounds() {
        if (
            this.map &&
            this.markerBounds
        ) {
            this.map.fitBounds(this.markerBounds);
        }
    }

    /**
     * Clear lines
     */
    private clearLines() {
        if (this.map) {
            _.each(this._lines, (line: google.maps.Polyline) => {
                line.setMap(null);
            });
        }
    }

    /**
     * Set lines
     */
    private setLines() {
        if (this.map) {
            _.each(this._lines, (line: google.maps.Polyline) => {
                line.setMap(this.map);
            });
        }
    }

    /**
     * Check to see if maps was initialized
     * @returns {boolean}
     */
    isMapsInitialized(): boolean {
        // determine if google maps script was loaded
        const windowWithMaps: { google: { maps } } = window as any;
        const googleMapApiInitialized = windowWithMaps.google &&
            windowWithMaps.google.maps;

        // do we need to initialize map ?
        if (
            googleMapApiInitialized &&
            this.googleMapElement &&
            !this.map
        ) {
            // init map
            this.map = new google.maps.Map(
                this.googleMapElement.nativeElement, {
                    // Phoenix in USA - Default value - since we need to provide one...
                    // as soon as data is loaded center will be changed so we can see all markers ( addresses )
                    center: new google.maps.LatLng(33.448376, -112.074036),
                    zoom: this.zoom,
                    mapTypeId: this.mapType
                }
            );

            // init map
            this.setMarkers();
            this.setLines();
        }

        // finished
        return googleMapApiInitialized;
    }
}
