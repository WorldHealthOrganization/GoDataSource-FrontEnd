import { Component, HostListener, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { TileArcGISRest, Vector as VectorSource, Cluster } from 'ol/source';
import { transform } from 'ol/proj';
import { Select as InteractionSelect } from 'ol/interaction';
import Feature from 'ol/Feature';
import { Point, LineString } from 'ol/geom';
import { Icon, Style, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MapServerModel } from '../../../../core/models/map-server.model';
import { Observable ,  Subscriber ,  Subscription } from 'rxjs';
import { addCommon as addCommonProjections } from 'ol/proj.js';
import { v4 as uuid } from 'uuid';

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

export enum WorldMapMarkerLayer {
    OVERLAY = 'overlay',
    CLUSTER = 'cluster'
}

export class WorldMapMarker {
    id: string;
    point: WorldMapPoint;
    label: string;
    labelColor: string = '#FFF';
    type: WorldMapMarkerType = WorldMapMarkerType.IMAGE;
    radius: number = 5;
    color: string = '#000';
    layer: WorldMapMarkerLayer = WorldMapMarkerLayer.OVERLAY;
    overlaySingleDisplayLabel: boolean = false;
    selected: (map: WorldMapComponent, data: WorldMapMarker) => void;
    data: any;

    constructor(data: {
        // required
        point: WorldMapPoint,

        // optional
        label?: string,
        labelColor?: string,
        type?: WorldMapMarkerType,
        radius?: number,
        color?: string,
        layer?: WorldMapMarkerLayer,
        overlaySingleDisplayLabel?: boolean,
        selected?: (map: WorldMapComponent, data: WorldMapMarker) => void,
        data?: any
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );

        // generate id
        this.id = uuid();
    }
}

export enum WorldMapPathType {
    LINE = 'line',
    ARROW = 'arrow'
}

export class WorldMapPath {
    points: WorldMapPoint[];
    type: WorldMapPathType = WorldMapPathType.LINE;
    color: string = '#000';
    selected: (map: WorldMapComponent, data: WorldMapPath) => void;
    lineWidth: number = 3;
    offsetX: number = 0;
    offsetY: number = 0;
    data: any;

    constructor(data: {
        // required
        points: WorldMapPoint[],

        // optional
        type?: WorldMapPathType,
        color?: string,
        lineWidth?: number,
        offsetX?: number,
        offsetY?: number,
        selected?: (map: WorldMapComponent, data: WorldMapPath) => void,
        data?: any
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
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
export class WorldMapComponent implements OnInit, OnDestroy {
    /**
     * Map fill size ( Default w: 100%, h: 400px )
     */
    private _width: string = '100%';
    private _height: string = '400px';
    @Input() set width(width: string) {
        // set value
        this._width = width;

        // update map size
        this.updateMapSize();
    }
    get width(): string {
        return this._width;
    }
    @Input() set height(height: string) {
        // set value
        this._height = height;

        // update map size
        this.updateMapSize();
    }
    get height(): string {
        return this._height;
    }

    /**
     * Display disclaimer
     */
    @Input() displayDisclaimer: boolean = true;

    /**
     * Display disclaimer content
     */
    displayDisclaimerContent: boolean = true;

    /**
     * Display spinner instead of map ?
     */
    private _displayLoading: boolean = false;
    @Input() set displayLoading(displayLoading: boolean) {
        // display loading
        const needToInitMap: boolean = this._displayLoading && !displayLoading;
        this._displayLoading = displayLoading;

        // wait for binding to take effect => ngIf
        setTimeout(() => {
            if (needToInitMap) {
                this.map = null;
                this.initializeMap();
            }
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
     * Map Overlay Layer Source
     */
    mapOverlayLayerSource: VectorSource;

    /**
     * Merge distance
     */
    private _clusterDistance: number = 10;
    @Input() set clusterDistance(clusterDistance: number) {
        this._clusterDistance = clusterDistance;
        if (this.mapClusterSource) {
            this.mapClusterSource.setDistance(clusterDistance);
        }
    }
    get clusterDistance(): number {
        return this._clusterDistance;
    }

    /**
     * Map cluster vector source
     */
    mapClusterLayerSource: VectorSource;

    /**
     * Cluster
     */
    mapClusterSource: Cluster;

    /**
     * Style cache
     */
    styleCache: {
        [key: string]: Style
    } = {};

    /**
     * Cluster size color
     */
    @Input() clusterLabelColor: string = '#FFF';

    /**
     * Fit layer
     */
    @Input() fitLayer: WorldMapMarkerLayer = WorldMapMarkerLayer.OVERLAY;

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
     * Minimum map zoom level ( >= 1 )
     */
    @Input() minZoom: number;

    /**
     * Maximum map zoom level ( >= 1 )
     */
    @Input() maxZoom: number;

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
    @Input() centerLocationZoom: number;

    // subscribers
    outbreakSubscriber: Subscription;

    /**
     * Display / Hide marker labels
     */
    private _displayLabels: boolean = true;
    @Input() set displayLabels(displayLabels: boolean) {
        // set value
        this._displayLabels = displayLabels;

        // init map markers
        this.reinitializeOverlay();
    }
    get displayLabels(): boolean {
        return this._displayLabels;
    }

    /**
     * Select map features handler
     */
    private _clickSelect: InteractionSelect;

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
        // fix ol bug in production build: https://github.com/openlayers/openlayers/issues/9019#issuecomment-444441291
        addCommonProjections();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
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
                                    url: mapServer.url,
                                    crossOrigin: 'anonymous'
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

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
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
            if (this.centerLocationZoom) {
                this.map.getView().setZoom(this.centerLocationZoom);
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
            this.map.getView().fit(
                this.markerBounds,
                this.map.getSize()
            );
        }
    }

    /**
     * Initialize Overlay
     */
    reinitializeOverlay() {
        // check if we have something to reinitialize
        if (!this.mapOverlayLayerSource) {
            return;
        }

        // clear markers & lines
        this.mapOverlayLayerSource.clear();
        this.mapClusterLayerSource.clear();
        this.styleCache = {};

        // add markers
        _.each(this.markers, (markerData: WorldMapMarker) => {
            // create marker
            const marker: Feature = new Feature(
                new Point(this.transformFromLatLng(
                    markerData.point.latitude,
                    markerData.point.longitude
                ))
            );

            // keep marker data
            marker.setProperties({
                dataForEventListeners: markerData
            });

            // create icons style for marker
            const style: {
                image?: Icon | CircleStyle,
                text?: Text
            } = {};

            // set image
            switch (markerData.type) {
                case WorldMapMarkerType.IMAGE:
                    style.image = new Icon({
                        anchor: [0.5, 0.9],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        src: '/assets/images/pin.png'
                    });
                    break;

                case WorldMapMarkerType.CIRCLE:
                    style.image = new CircleStyle({
                        radius: markerData.radius,
                        fill: new Fill({
                            color: markerData.color
                        })
                    });
                    break;
            }

            // if label provided attach it
            if (
                this.displayLabels &&
                markerData.label
            ) {
                style.text = new Text({
                    text: markerData.label,
                    offsetY: -24,
                    font: 'bold 14px Roboto',
                    fill: new Fill({
                        color: markerData.labelColor
                    })
                });
            }

            // stylize marker
            marker.setStyle(new Style(style));

            // do we need to group markers ?
            if (markerData.layer === WorldMapMarkerLayer.CLUSTER) {
                this.mapClusterLayerSource.addFeature(marker);
            } else {
                // add marker to map overlay
                this.mapOverlayLayerSource.addFeature(marker);
            }
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
                    path.type === WorldMapPathType.ARROW
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
                            offsetX: path.offsetX,
                            offsetY: path.offsetY + 2,
                            font: 'bold 30px Arial',
                            fill: new Fill({
                                color: path.color
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
                    color: path.color,
                    width: path.lineWidth
                })
            }));

            // keep line data
            featurePath.setProperties({
                dataForEventListeners: path
            });

            // add path to overlay
            this.mapOverlayLayerSource.addFeature(featurePath);
        });

        // determine bounds
        this.markerBounds = this.fitLayer === WorldMapMarkerLayer.CLUSTER ?
            this.mapClusterLayerSource.getExtent() :
            this.mapOverlayLayerSource.getExtent();

        // update map size
        this.updateMapSize();
    }

    /**
     * Style Features
     * @param feature
     */
    clusterStyleFeature(feature: Feature): Style {
        // determine number of markers
        const features: Feature[] = feature.get('features');
        const size: number = features.length;

        // in case we have just one marker in this group & we are allowed to display marker info, do it...
        let cacheKey: string = `___${size}`;
        let markerData: WorldMapMarker;
        if (
            size === 1 &&
            features[0].getProperties &&
            features[0].getProperties() &&
            features[0].getProperties().dataForEventListeners &&
            features[0].getProperties().dataForEventListeners.overlaySingleDisplayLabel
        ) {
            markerData = features[0].getProperties().dataForEventListeners;
            cacheKey = markerData.id;
        }

        // do we have already a style configured for what we need to display ?
        if (this.styleCache[cacheKey]) {
            return this.styleCache[cacheKey];
        }

        // create a new style
        // - do we need to display the label of the marker instead of the number ?
        if (markerData) {
            this.styleCache[cacheKey] = features[0].getStyle();
        } else {
            this.styleCache[cacheKey] = new Style({
                image: new Icon({
                    anchor: [0.5, 0.9],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    src: '/assets/images/pin.png'
                }),
                text: new Text({
                    text: size.toString(),
                    offsetY: -24,
                    font: 'bold 10px Roboto',
                    fill: new Fill({
                        color: this.clusterLabelColor
                    })
                })
            });
        }

        // finished
        return this.styleCache[cacheKey];
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
            minZoom: this.minZoom,
            maxZoom: this.maxZoom
        });

        // create overlay layer source
        this.mapOverlayLayerSource = new VectorSource();

        // add overlay - markers & lines layer
        this.layers.push(new VectorLayer({
            source: this.mapOverlayLayerSource
        }));

        // initialize cluster layer source
        this.mapClusterLayerSource = new VectorSource();

        // initialize cluster
        this.mapClusterSource = new Cluster({
            distance: this.clusterDistance,
            source: this.mapClusterLayerSource
        });

        // add cluster layer
        this.layers.push(new VectorLayer({
            source: this.mapClusterSource,
            style: (feature: Feature): Style => {
                return this.clusterStyleFeature(feature);
            }
        }));

        // initialize map
        this.map = new Map({
            layers: this.layers,
            target: 'worldMap',
            view: this.mapView
        });

        // EVENTS LISTENERS
        // create click listener
        this._clickSelect = new InteractionSelect({
            multi: true,
            style: (feature) => {
                const properties = feature.getProperties();
                return _.isEmpty(properties.features) ?
                    feature.getStyle() :
                    this.clusterStyleFeature(feature);
            },
            filter: (feature) => {
                if (!feature.getProperties) {
                    return false;
                } else {
                    // check to see how we should handle this
                    // - as a group of markers
                    // - or as a single marker
                    const properties = feature.getProperties();
                    if (properties) {
                        if (!_.isEmpty(properties.features)) {
                            // if just one then we need to redirect directly to marker event
                            if (
                                properties.features.length === 1 &&
                                properties.features[0].getProperties &&
                                properties.features[0].getProperties() &&
                                properties.features[0].getProperties().dataForEventListeners &&
                                properties.features[0].getProperties().dataForEventListeners.selected
                            ) {
                                return true;
                            } else {
                                // all child items are markers ?
                                let allAreMarkers: boolean = true;
                                _.each(properties.features, (childFeature: Feature) => {
                                    if (
                                        !childFeature.getProperties ||
                                        !childFeature.getProperties() ||
                                        !childFeature.getProperties().dataForEventListeners
                                    ) {
                                        // invalid data
                                        allAreMarkers = false;

                                        // stop for
                                        return false;
                                    }
                                });

                                // can we display group items ?
                                return allAreMarkers;
                            }
                        } else {
                            // single marker
                            return properties.dataForEventListeners &&
                                properties.dataForEventListeners.selected;
                        }
                    } else {
                        return false;
                    }
                }
            }
        });
        this._clickSelect.on('select', (data: {
            deselected: any[],
            selected: any[],
            mapBrowserEvent: any
        }) => {
            // determine feature with bigger priority
            let selectFeature: Feature;
            _.each(data.selected, (feature: Feature | any) => {
                // allow system to select again the same feature
                this.clearSelectedItems();

                // get feature properties
                const properties = feature.getProperties();
                if (!_.isEmpty(properties.features)) {
                    if (
                        properties.features.length === 1 &&
                        properties.features[0].getProperties &&
                        properties.features[0].getProperties() &&
                        properties.features[0].getProperties().dataForEventListeners &&
                        properties.features[0].getProperties().dataForEventListeners.selected
                    ) {
                        // single record
                        if (properties.features[0].getProperties().dataForEventListeners instanceof WorldMapPath) {
                            selectFeature = selectFeature ? selectFeature : properties.features[0];
                        } else {
                            // anything else is more important than a line
                            selectFeature = properties.features[0];
                        }
                    } else {
                        // determine all clickable items from group
                        const groupItems: (WorldMapPath | WorldMapMarker)[] = [];
                        properties.features.forEach((item) => {
                            if (item.getProperties().dataForEventListeners.selected) {
                                groupItems.push(item.getProperties().dataForEventListeners);
                            }
                        });

                        // do we have clickable items in this group ?
                        if (!_.isEmpty(groupItems)) {
                            // call method for handling groups
                            console.log(groupItems);
                            // #TODO
                        }
                    }
                } else {
                    // single record
                    if (properties.dataForEventListeners instanceof WorldMapPath) {
                        selectFeature = selectFeature ? selectFeature : feature;
                    } else {
                        // anything else is more important than a line
                        selectFeature = feature;
                    }
                }
            });

            // trigger select
            if (selectFeature) {
                selectFeature.getProperties().dataForEventListeners.selected(
                    this,
                    selectFeature.getProperties().dataForEventListeners
                );
            }
        });

        // add events listeners
        this.map.addInteraction(this._clickSelect);
        // END OF EVENTS LISTENERS

        // initialize map overlay
        this.reinitializeOverlay();

        // fit markers ?
        if (this.fitMapOnMarkersChange) {
            this.fitMarkerBounds();
        } else {
            // center location if we have something to center
            this.refreshMapCenter();
        }

        // update map size
        this.updateMapSize();
    }

    /**
     * Update map size
     */
    public updateMapSize() {
        // check if map was initialized
        if (_.isEmpty(this.map)) {
            // finished
            return;
        }

        // update map size
        setTimeout(() => {
            this.map.updateSize();
        });
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

    /**
     * Print map to blob
     */
    printToBlob(): Observable<Blob> {
        return new Observable((observer: Subscriber<Blob>) => {
            // map initialized
            if (this.map) {
                // wait for map render
                this.map.once('rendercomplete', (event) => {
                    const canvas = event.context.canvas;
                    if (navigator.msSaveBlob) {
                        observer.next(canvas.msToBlob());
                        observer.complete();
                    } else {
                        canvas.toBlob(function (blob) {
                            observer.next(blob);
                            observer.complete();
                        });
                    }
                });

                // render
                this.map.renderSync();
            } else {
                observer.next(null);
                observer.complete();
            }
        });
    }

    /**
     * Clear Selected items
     */
    private clearSelectedItems() {
        this._clickSelect.getFeatures().clear();
    }

    /**
     * Update map size
     */
    @HostListener('window:resize')
    private updateMapSizeOnWindowResize() {
        this.updateMapSize();
    }
}
