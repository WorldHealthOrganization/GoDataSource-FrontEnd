import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { TileArcGISRest, Vector as VectorSource } from 'ol/source';
import { transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { Point, LineString } from 'ol/geom';
import { Icon, Style, Text, Fill, Stroke } from 'ol/style';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { MapServerModel } from '../../../core/models/map-server.model';

export class WorldMapPoint {
    constructor(
        public latitude: number,
        public longitude: number
    ) {}
}

export enum WorldMapMarkerType {
    IMAGE = 'image',
    CIRCLE = 'circle'
}

export class WorldMapMarker {
    constructor(
        public point: WorldMapPoint,
        public label?: string,
        public type: WorldMapMarkerType = WorldMapMarkerType.IMAGE
    ) {}
}

export class WorldMapPath {
    public points: WorldMapPoint[];

    constructor(
        public addArrows: boolean = false,
        ...points: WorldMapPoint[]
    ) {
        this.points = points;
    }

    add(point: WorldMapPoint) {
        this.points.push(point);
    }
}

@Component({
    selector: 'app-world-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './world-map.component.html',
    styleUrls: ['./world-map.component.less']
})
export class WorldMapComponent implements OnInit {
    /**
     * Map fill size ( Default w: 100%, h: 400px )
     */
    @Input() width: string = '100%';
    @Input() height: string = '400px';

    /**
     * Display spinner instead of map ?
     */
    private _displayLoading: boolean = false;
    @Input() set displayLoading(displayLoading: boolean) {
        // display loading
        this._displayLoading = displayLoading;

        // wait for binding to take effect => ngIf
        setTimeout(() => {
            this.initializeMap();
        });
    }
    get displayLoading(): boolean {
        return this._displayLoading;
    }

    /**
     * Map Tiles / Layers
     */
    layers: TileLayer[] = [];

    /**
     * Map handler
     */
    map: Map;

    /**
     * Map View
     */
    mapView: View;

    /**
     * Map Overlay Layer
     */
    mapOverlayLayer: VectorLayer;

    /**
     * Map Overlay Layer Source
     */
    mapOverlayLayerSource: VectorSource;

    /**
     * Map Markers
     */
    private _markers: WorldMapMarker[] = [];
    @Input() set markers(markers: WorldMapMarker[]) {
        // set the new markers
        this._markers = markers;

        // init map markers
        this.reinitializeOverlay();

        // fit markers ?
        if (this.fitMapOnMarkersChange) {
            this.fitMarkerBounds();
        }
    }
    get markers(): WorldMapMarker[] {
        return this._markers;
    }

    /**
     * Marker Text color
     */
    @Input() markerTextColor: string = '#FFF';

    /**
     * Map Lines
     */
    private _lines: WorldMapPath[] = [];
    @Input() set lines(lines: WorldMapPath[]) {
        // set the new lines
        this._lines = lines;

        // init map lines
        this.reinitializeOverlay();
    }
    get lines(): WorldMapPath[] {
        return this._lines;
    }

    /**
     * Lines color
     */
    @Input() lineColor: string = '#000';

    /**
     * Minimum map zoom level ( >= 1 )
     */
    @Input() minZoon: number = 2;

    /**
     * Zoom out / in map to fit markers whenever we set markers ?
     */
    @Input() fitMapOnMarkersChange: boolean = false;

    /**
     * Marker bounds ( minx, miny, maxx, maxy )
     */
    private markerBounds: number[];

    /**
     * Center map on specific point
     */
    private _centerLocation: WorldMapPoint;
    @Input() set centerLocation(value: WorldMapPoint) {
        // set center location
        this._centerLocation = value;

        // center map
        this.refreshMapCenter();
    }
    get centerLocation(): WorldMapPoint {
        return this._centerLocation;
    }

    /**
     * Center zoom when focusing on a specific point
     */
    @Input() centerLocationZoom: number = 10;

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService
    ) {}

    /**
     * Init map
     */
    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // no outbreak yet ?
                if (selectedOutbreak) {
                    // set map layers
                    this.layers = _.map(
                        _.filter(selectedOutbreak.arcGisServers, 'url'),
                        (mapServer: MapServerModel) => {
                            return new TileLayer({
                                source: new TileArcGISRest({
                                    url: mapServer.url
                                })
                            });
                        });

                    // wait for binding to take effect => ngIf
                    setTimeout(() => {
                        this.initializeMap();
                    });
                }
            });
    }

    /**
     * Refresh map center
     */
    private refreshMapCenter() {
        if (
            this.map &&
            this.centerLocation
        ) {
            // set position
            this.map.getView().setCenter(
                this.transformFromLatLng(
                    this.centerLocation.latitude,
                    this.centerLocation.longitude
                )
            );

            // zoom closer
            this.map.getView().setZoom(this.centerLocationZoom);
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
            this.map.getView().fit(
                this.markerBounds,
                this.map.getSize()
            );
        }
    }

    /**
     * Initilize Overlay
     */
    reinitializeOverlay() {
        // check if we have something to reinitialize
        if (!this.mapOverlayLayerSource) {
            return;
        }

        // clear markers & lines
        this.mapOverlayLayerSource.clear();

        // add markers
        _.each(this.markers, (markerData: WorldMapMarker) => {
            // create marker
            const marker: Feature = new Feature(
                new Point(this.transformFromLatLng(
                    markerData.point.latitude,
                    markerData.point.longitude
                ))
            );

            // create icons style for marker
            const style: {
                image: Icon,
                text?: Text
            } = {
                image: new Icon({
                    anchor: [0.5, 0.9],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    src: '/assets/images/pin.png'
                })
            };

            // if label provided attach it
            if (markerData.label) {
                style.text = new Text({
                    text: markerData.label,
                    offsetY: -24,
                    font: 'bold 14px Roboto',
                    fill: new Fill({
                        color: this.markerTextColor
                    })
                });
            }

            // stylize marker
            marker.setStyle(new Style(style));

            // add marker to map overlay
            this.mapOverlayLayerSource.addFeature(marker);
        });

        // add lines
        _.each(this.lines, (path: WorldMapPath) => {
            // must have at least 2 points to draw aline...duh...
            if (path.points.length < 2) {
                return;
            }

            // construct points array
            const points: any = [];
            let prevP: any;
            _.each(path.points, (point: WorldMapPoint, index: number) => {
                // add line point
                const p = this.transformFromLatLng(
                    point.latitude,
                    point.longitude
                );
                points.push(p);

                // not first & we need to add arrows ?
                if (
                    index > 0 &&
                    path.addArrows
                ) {
                    // determine arrow rotation according to line points
                    const rotation: number = Math.atan2(
                        p[1] - prevP[1],
                        p[0] - prevP[0]
                    );

                    // configure arrow
                    const arrow: Feature = new Feature(new Point(p));
                    arrow.setStyle(new Style({
                        text: new Text({
                            text: '>',
                            offsetX: -5,
                            font: 'bold 30px Roboto',
                            fill: new Fill({
                                color: this.lineColor
                            }),
                            rotation: -rotation
                        })
                    }));

                    // draw arrow
                    this.mapOverlayLayerSource.addFeature(arrow);
                }

                // keep previous point to be used when determining line rotation
                prevP = p;
            });

            // create path
            const featurePath = new Feature({
                geometry: new LineString(points)
            });

            // stylize path
            featurePath.setStyle(new Style({
                stroke: new Stroke({
                    color: this.lineColor,
                    width: 3
                })
            }));

            // add path to overlay
            this.mapOverlayLayerSource.addFeature(featurePath);
        });

        // determine bounds
        this.markerBounds = this.mapOverlayLayerSource.getExtent();
    }

    /**
     * Initialize World Map
     */
    initializeMap() {
        // no point in initializing map if map is hidden
        // or map already initialized
        if (
            this.displayLoading ||
            this.layers.length < 1 ||
            !_.isEmpty(this.map)
        ) {
            return;
        }

        // initialize map elements
        this.mapView = new View({
            center: [0, 0],
            zoom: 5,
            minZoom: this.minZoon
        });

        // create overlay layer source
        this.mapOverlayLayerSource = new VectorSource();

        // create overlay layer
        this.mapOverlayLayer = new VectorLayer({
            source: this.mapOverlayLayerSource
        });

        // add overlay - markers & lines layer
        this.layers.push(this.mapOverlayLayer);

        // initialize map
        this.map = new Map({
            layers: this.layers,
            target: 'worldMap',
            view: this.mapView
        });

        // initialize map overlay
        this.reinitializeOverlay();

        // fit markers ?
        if (this.fitMapOnMarkersChange) {
            this.fitMarkerBounds();
        } else {
            // center location if we have something to center
            this.refreshMapCenter();
        }
    }

    /**
     * Convert lat & lng to local units
     * @param latitude
     * @param longitude
     */
    transformFromLatLng(
        latitude: number,
        longitude: number
    ): any {
        return transform(
            [longitude, latitude],
            'EPSG:4326',
            'EPSG:3857'
        );
    }
}
