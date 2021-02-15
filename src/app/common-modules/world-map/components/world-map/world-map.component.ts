import {
    Component,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import * as _ from 'lodash';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import {
    Cluster,
    TileArcGISRest,
    Vector as VectorSource,
    XYZ
} from 'ol/source';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Constants } from '../../../../core/models/constants';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { addCommon as addCommonProjections } from 'ol/proj.js';
import { v4 as uuid } from 'uuid';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { MatDialogRef } from '@angular/material';
import { applyStyle } from 'ol-mapbox-style';

/**
 * Point used for rendering purposes
 */
export class WorldMapPoint {
    constructor(
        public latitude: number,
        public longitude: number
    ) {}
}

/**
 * Marker Type
 */
export enum WorldMapMarkerType {
    IMAGE = 'image',
    CIRCLE = 'circle'
}

/**
 * Marker top layer (layer used to render items on top of the outbreak layers - used to render markers, paths ...)
 */
export enum WorldMapMarkerLayer {
    OVERLAY = 'overlay',
    CLUSTER = 'cluster'
}

/**
 * Map marker - e.g. group / case / contact ...
 */
export class WorldMapMarker {
    // data
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

    /**
     * Constructor
     */
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

/**
 * Map path - e.g. relationship, move from - to location
 */
export enum WorldMapPathType {
    LINE = 'line',
    ARROW = 'arrow'
}

/**
 * Map path - e.g. relationship, move from - to location
 */
export class WorldMapPath {
    // data
    id: string;
    points: (WorldMapPoint | WorldMapMarker)[];
    type: WorldMapPathType = WorldMapPathType.LINE;
    color: string = '#000';
    selected: (map: WorldMapComponent, data: WorldMapPath) => void;
    lineWidth: number = 3;
    offsetX: number = 0;
    offsetY: number = 0;
    data: any;
    hideOnMarkerCluster: boolean = false;
    label: string;

    /**
     * Constructor
     */
    constructor(data: {
        // required
        points: (WorldMapPoint | WorldMapMarker)[],

        // optional
        type?: WorldMapPathType,
        color?: string,
        lineWidth?: number,
        offsetX?: number,
        offsetY?: number,
        selected?: (map: WorldMapComponent, data: WorldMapPath) => void,
        data?: any,
        hideOnMarkerCluster?: boolean,
        label?: string
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );

        // generate id
        this.id = uuid();
    }

    /**
     * Add new point
     */
    add(point: WorldMapPoint | WorldMapMarker) {
        this.points.push(point);
    }
}

/**
 * Map cluster line - grouping lines together
 */
class WorldMapClusterLine {
    id: string;
    data: WorldMapPath[];
    selected: (map: WorldMapComponent, lines: WorldMapPath[]) => void;

    /**
     * Constructor
     */
    constructor(data: {
        data: WorldMapPath[],
        selected?: (map: WorldMapComponent, clusterLine: WorldMapClusterLine) => void
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

@Component({
    selector: 'app-world-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './world-map.component.html',
    styleUrls: ['./world-map.component.less']
})
export class WorldMapComponent implements OnInit, OnDestroy {
    // Map fill size ( Default w: 100%, h: 400px )
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

    // Display disclaimer
    @Input() displayDisclaimer: boolean = true;

    // Display disclaimer content
    displayDisclaimerContent: boolean = true;

    // Display spinner instead of map ?
    private _displayLoading: boolean = false;
    @Input() set displayLoading(displayLoading: boolean) {
        // display loading
        const needToInitMap: boolean = this._displayLoading && !displayLoading;
        this._displayLoading = displayLoading;

        // initialize map
        if (needToInitMap) {
            this.map = null;
            this.initializeMap();
        }
    }
    get displayLoading(): boolean {
        return this._displayLoading;
    }

    // Map Tiles / Layers
    layersLoading: boolean = true;
    layers: {
        styleLoaded: boolean,
        layer: TileLayer | VectorTileLayer | VectorLayer
    }[] = [];

    // Map handler
    map: Map;

    // Map View
    mapView: View;

    // Map Overlay Layer Source
    mapOverlayLayerSource: VectorSource;

    // Map Overlay Layer Source used to draw cluster stuff ( grouped lines )
    mapOverlayLayerSourceForCluster: VectorSource;

    // Merge distance
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

    // Map cluster vector source
    mapClusterLayerSource: VectorSource;

    // Cluster
    mapClusterSource: Cluster;

    // Style cache
    styleCache: {
        [key: string]: Style
    } = {};

    // Cluster size color
    @Input() clusterLabelColor: string = '#FFF';

    // Fit layer
    @Input() fitLayer: WorldMapMarkerLayer = WorldMapMarkerLayer.OVERLAY;

    // Map Markers
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

    // Map Lines
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

    // Minimum map zoom level ( >= 1 )
    @Input() minZoom: number;

    // Maximum map zoom level ( >= 1 )
    @Input() maxZoom: number;

    // Zoom out / in map to fit markers whenever we set markers ?
    @Input() fitMapOnMarkersChange: boolean = false;

    // Marker bounds ( minx, miny, max, maxy )
    private markerBounds: number[];

    // Center map on specific point
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

    // Center zoom when focusing on a specific point
    @Input() centerLocationZoom: number;

    // subscribers
    outbreakSubscriber: Subscription;

    // Display / Hide marker labels
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

    // Used to hide features
    private hiddenFeatureStyle: Style = new Style();

    // Handler for cluster update
    private clusterUpdatePending: any;

    // Used to draw cluster lines
    @Input() clusterLineStyle: Style = new Style({
        stroke: new Stroke({
            color: '#00F',
            width: 5,
            lineDash: [8, 8]
        })
    });

    // Marker section title for group dialog
    @Input() groupMarkerTitle: string;

    // Path ( lines ) section title for group dialog
    @Input() groupPathTitle: string;

    // It's full screen activated?
    fullScreenMode: boolean = false;

    // Event emitter for full screen toggle
    @Output() fullScreenToggle = new EventEmitter<any>();

    // group dialog
    groupDataDialogHandler: MatDialogRef<DialogComponent>;

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService
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
                if (!selectedOutbreak) {
                    return;
                }

                // construct layer data used by our map
                this.layersLoading = true;
                this.layers = [];
                (selectedOutbreak.arcGisServers || []).forEach((mapServer) => {
                    // filter out bad layers
                    if (!mapServer.url) {
                        return;
                    }

                    // create layer based on the map type
                    let layerData: {
                        layer: TileLayer | VectorTileLayer | VectorLayer,
                        styleLoaded: boolean
                    };
                    switch (mapServer.type) {
                        case Constants.OUTBREAK_MAP_SERVER_TYPES.TILE_XYZ.value:
                            // add '/tile/{z}/{y}/{x}' to url if not specified
                            layerData = {
                                styleLoaded: true,
                                layer: new TileLayer({
                                    source: new XYZ({
                                        url: mapServer.url + (!/\/tile\/{z}\/{y}\/{x}$/.test(mapServer.url) ? '/tile/{z}/{y}/{x}' : ''),
                                        crossOrigin: 'anonymous'
                                    })
                                })
                            };

                            // finished
                            break;

                        case Constants.OUTBREAK_MAP_SERVER_TYPES.VECTOR_TILE_VECTOR_TILE_LAYER.value:
                            layerData = {
                                styleLoaded: false,
                                layer: new VectorTileLayer({
                                    // add '/tile/{z}/{y}/{x}.pbf' to url if not specified
                                    source: new VectorTileSource({
                                        url: mapServer.url + (!/\/tile\/{z}\/{y}\/{x}.pbf$/.test(mapServer.url) ? '/tile/{z}/{y}/{x}.pbf' : ''),
                                        format: new MVT(),
                                        crossOrigin: 'anonymous'
                                    })
                                })
                            };

                            // load styles
                            const path = mapServer.url + '/resources/styles/';
                            fetch(path + 'root.json')
                                .then(r => r.json())
                                .then((glStyle) => {
                                    // apply style
                                    applyStyle(
                                        layerData.layer,
                                        glStyle,
                                        'esri',
                                        path
                                    ).then(() => {
                                        layerData.styleLoaded = true;

                                        // try again to init map
                                        this.initializeMap();
                                    });
                                });

                            // finished
                            break;

                        default:
                            // Constants.OUTBREAK_MAP_SERVER_TYPES.TILE_TILE_ARC_GIS_REST.values:
                            layerData = {
                                styleLoaded: true,
                                layer: new TileLayer({
                                    source: new TileArcGISRest({
                                        url: mapServer.url,
                                        crossOrigin: 'anonymous'
                                    })
                                })
                            };

                            // finished
                            break;
                    }

                    // add layer to list
                    this.layers.push(layerData);
                });

                // initialize map
                this.initializeMap();
            });
    }

    /**
     * Component destroyed
     */
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
        this.mapOverlayLayerSourceForCluster.clear();
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
            _.each(path.points, (pathPoint: WorldMapPoint | WorldMapMarker, index: number) => {
                // determine actual points
                const point: WorldMapPoint = pathPoint instanceof WorldMapPoint ?
                    pathPoint :
                    pathPoint.point;

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

                    // keep line data
                    arrow.setProperties({
                        notReallyALine: true,
                        dataForEventListeners: path
                    });

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
     * Hide / Reposition overlay features ( e.g. lines ) when we don't need to display them ( e.g. lines between features from the same cluster group or lines between cluster groups )
     */
    updateOverlayFeaturesAccordinglyToClusterGroups() {
        // local definitions
        interface IClusterFeatureGroup {
            groupIndex: number;
            groupSize: number;
            marker: WorldMapMarker;
        }
        interface IOverlayFeatureGroup {
            groups: {
                [groupKey: string]: IClusterFeatureGroup
            };
            hasOnlyGroupsOfSize1: boolean;
            sameClusterGroup: boolean;
        }
        interface IClusterLines {
            sortedGroups: IClusterFeatureGroup[];
            lines: WorldMapPath[];
        }

        // there is already a pending update ?
        if (this.clusterUpdatePending) {
            return;
        }

        // schedule update
        this.clusterUpdatePending = setTimeout(() => {
            // used to easily determine the cluster group later
            const clusterFeaturesMap: {
                [markerId: string]: IClusterFeatureGroup
            } = {};

            // go through cluster features & map children features to easily determine the cluster group later
            const clusterFeatures: Feature[] = this.mapClusterSource.getFeatures();
            clusterFeatures.forEach((clusterFeature: Feature, groupIndex: number) => {
                // go through each child and set the group
                const clusterChildFeatures: Feature[] = clusterFeature.get('features');
                clusterChildFeatures.forEach((childClusterFeature: Feature) => {
                    const properties = childClusterFeature.getProperties();
                    if (properties.dataForEventListeners instanceof WorldMapMarker) {
                        clusterFeaturesMap[properties.dataForEventListeners.id] = {
                            groupIndex: groupIndex,
                            groupSize: clusterChildFeatures.length,
                            marker: properties.dataForEventListeners
                        };
                    }
                });
            });

            // show feature & remove hide properties
            const showOverlayFeature = (overlayFeature, featureStyle, featureProperties) => {
                // show if we don't need to hide it :)
                if (featureStyle === this.hiddenFeatureStyle) {
                    // make feature visible
                    overlayFeature.setStyle(featureProperties.featureOldStyle);

                    // remove visibility properties
                    overlayFeature.setProperties({
                        ...featureProperties,
                        ...{
                            featureOldStyle: null,
                            clusterGroupFeature: null
                        }
                    }, true);
                }
            };

            // go through cluster features and determine which overlay data should be hidden and which should be visible
            const overlayGroupLines: {
                [path: string]: IClusterLines
            } = {};
            const overlayFeatures: Feature[] = this.mapOverlayLayerSource.getFeatures();
            (overlayFeatures || []).forEach((overlayFeature: Feature) => {
                // retrieve overlay feature properties
                const overlayProperties: any = overlayFeature.getProperties ? overlayFeature.getProperties() : null;

                // do we need to check if we should hide this feature ?
                if (
                    !(overlayProperties.dataForEventListeners instanceof WorldMapPath) ||
                    !overlayProperties.dataForEventListeners.hideOnMarkerCluster
                ) {
                    return;
                }

                // go through points and determine if all points are under a cluster
                let featureGroups: IOverlayFeatureGroup;
                _.each(overlayProperties.dataForEventListeners.points, (point: WorldMapMarker | WorldMapPoint) => {
                    if (point instanceof WorldMapMarker) {
                        // check if this point isn't under the current cluster
                        if (!clusterFeaturesMap[point.id]) {
                            // ignore this one since it isn't mapped by cluster groups
                            return;
                        }

                        // determine feature groups & if path is just under one group
                        const groupKey: string = `_${clusterFeaturesMap[point.id].groupIndex}`;
                        if (
                            featureGroups !== undefined &&
                            featureGroups.groups[groupKey] === undefined
                        ) {
                            // different groups
                            featureGroups.sameClusterGroup = false;
                        }

                        // do we need to initialize feature groups ?
                        if (!featureGroups) {
                            featureGroups = {
                                groups: {},
                                hasOnlyGroupsOfSize1: true,
                                sameClusterGroup: true
                            };
                        }

                        // keep group to check the remaining points
                        featureGroups.groups[groupKey] = clusterFeaturesMap[point.id];

                        // determine if feature has groups of size bigger than 1
                        if (clusterFeaturesMap[point.id].groupSize > 1) {
                            featureGroups.hasOnlyGroupsOfSize1 = false;
                        }
                    }
                });

                // if not under any group then we should not hide it
                const featureStyle: Style = overlayFeature.getStyle();
                const featureProperties: any = overlayFeature.getProperties();
                if (!featureGroups) {
                    // show feature & remove hide properties
                    showOverlayFeature(overlayFeature, featureStyle, featureProperties);

                    // finished
                    return;
                }

                // hide features since they are all under the same cluster group ?
                if (featureGroups.sameClusterGroup) {
                    // we have just one group for this item, so we need to hide it
                    const featureGroup: IClusterFeatureGroup = featureGroups.groups[Object.keys(featureGroups.groups)[0]];

                    // check if group changed from last time we checked this feature
                    if (
                        featureStyle !== this.hiddenFeatureStyle ||
                        featureProperties.clusterGroupFeature !== clusterFeatures[featureGroup.groupIndex]
                    ) {
                        // construct property update object
                        const patchProperties: any = {};
                        if (featureStyle !== this.hiddenFeatureStyle) {
                            patchProperties.featureOldStyle = featureStyle;
                        }
                        const clusterGroupFeature = featureProperties.notReallyALine ? null : clusterFeatures[featureGroup.groupIndex];
                        if (featureProperties.clusterGroupFeature !== clusterGroupFeature) {
                            patchProperties.clusterGroupFeature = clusterGroupFeature;
                        }

                        // keep reference to old style
                        overlayFeature.setProperties({
                            ...featureProperties,
                            ...patchProperties
                        }, true);

                        // hide feature
                        overlayFeature.setStyle(this.hiddenFeatureStyle);
                    }
                } else {
                    // show features that are between markers ( groups with size 1 )
                    // - for other we need to group them & display links between groups & allow clickable group paths
                    if (featureGroups.hasOnlyGroupsOfSize1) {
                        // show feature & remove hide properties
                        showOverlayFeature(overlayFeature, featureStyle, featureProperties);
                    } else {
                        // ignore arrows
                        if (featureProperties.notReallyALine) {
                            // hide line
                            if (
                                featureStyle !== this.hiddenFeatureStyle ||
                                featureProperties.clusterGroupFeature
                            ) {
                                // construct property update object
                                const patchProperties: any = {};
                                if (featureStyle !== this.hiddenFeatureStyle) {
                                    patchProperties.featureOldStyle = featureStyle;
                                }
                                if (featureProperties.clusterGroupFeature) {
                                    patchProperties.clusterGroupFeature = null;
                                }

                                // keep reference to old style
                                overlayFeature.setProperties({
                                    ...featureProperties,
                                    ...patchProperties
                                }, true);

                                // hide feature
                                overlayFeature.setStyle(this.hiddenFeatureStyle);
                            }

                            // finished
                            return;
                        }

                        // has multiple group connections
                        // we need to merge them into one path with the correct positions
                        // - for other we need to group them & display links between groups & allow clickable group paths
                        const sortedGroups = _.sortBy(
                            featureGroups.groups,
                            'groupIndex'
                        );

                        // determine group path
                        let groupLinePath: string = '';
                        sortedGroups.forEach((group: IClusterFeatureGroup) => {
                            groupLinePath += `_${group.groupIndex}`;
                        });

                        // initialize overlay line info for these groups if necessary
                        if (!overlayGroupLines[groupLinePath]) {
                            overlayGroupLines[groupLinePath] = {
                                sortedGroups: sortedGroups,
                                lines: []
                            };
                        }

                        // add path to list of items under this cluster line
                        overlayGroupLines[groupLinePath].lines.push(overlayProperties.dataForEventListeners);

                        // hide line since we will draw it later under a cluster group line
                        if (
                            featureStyle !== this.hiddenFeatureStyle ||
                            featureProperties.clusterGroupFeature
                        ) {
                            // construct property update object
                            const patchProperties: any = {};
                            if (featureStyle !== this.hiddenFeatureStyle) {
                                patchProperties.featureOldStyle = featureStyle;
                            }
                            if (featureProperties.clusterGroupFeature) {
                                patchProperties.clusterGroupFeature = null;
                            }

                            // keep reference to old style
                            overlayFeature.setProperties({
                                ...featureProperties,
                                ...patchProperties
                            }, true);

                            // hide feature
                            overlayFeature.setStyle(this.hiddenFeatureStyle);
                        }
                    }
                }
            });

            // clear cluster overlay layer
            this.mapOverlayLayerSourceForCluster.clear();

            // draw groups cluster lines
            _.each(overlayGroupLines, (lineData: IClusterLines) => {
                // determine cluster points
                const points: any = [];
                lineData.sortedGroups.forEach((featureGroup: IClusterFeatureGroup) => {
                    points.push(clusterFeatures[featureGroup.groupIndex].getGeometry().getCoordinates());
                });

                // create path
                const featurePath = new Feature({
                    geometry: new LineString(points)
                });

                // stylize path
                featurePath.setStyle(this.clusterLineStyle);

                // keep line data
                featurePath.setProperties({
                    dataForEventListeners: new WorldMapClusterLine({
                        data: lineData.lines,
                        selected: (map: WorldMapComponent, clusterLine: WorldMapClusterLine) => {
                            // display dialog for grouped lines
                            this.displayChoseFromGroupDialog(clusterLine.data);
                        }
                    })
                });

                // add path to overlay
                this.mapOverlayLayerSourceForCluster.addFeature(featurePath);
            });

            // finished update
            this.clusterUpdatePending = null;
        }, 50);
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

        // check if all layer styles were loaded
        this.layersLoading = false;
        for (const layerData of this.layers) {
            if (!layerData.styleLoaded) {
                this.layersLoading = true;
                return;
            }
        }

        // wait for data to be binded so we can see the map dom element
        setTimeout(() => {
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
            this.layers.push({
                styleLoaded: true,
                layer: new VectorLayer({
                    source: this.mapOverlayLayerSource
                })
            });

            // create overlay cluster layer source
            this.mapOverlayLayerSourceForCluster = new VectorSource();

            // add overlay - markers & lines layer
            this.layers.push({
                styleLoaded: true,
                layer: new VectorLayer({
                    source: this.mapOverlayLayerSourceForCluster
                })
            });

            // initialize cluster layer source
            this.mapClusterLayerSource = new VectorSource();

            // initialize cluster
            this.mapClusterSource = new Cluster({
                distance: this.clusterDistance,
                source: this.mapClusterLayerSource
            });

            // update items accordingly to cluster groups
            this.mapClusterSource.on('addfeature', () => {
                this.updateOverlayFeaturesAccordinglyToClusterGroups();
            });
            this.mapClusterSource.on('removefeature', () => {
                this.updateOverlayFeaturesAccordinglyToClusterGroups();
            });

            // create cluster layer
            const clusterVectorLayer = new VectorLayer({
                source: this.mapClusterSource,
                style: (feature: Feature): Style => {
                    // render cluster feature
                    return this.clusterStyleFeature(feature);
                }
            });

            // add cluster layer
            this.layers.push({
                styleLoaded: true,
                layer: clusterVectorLayer
            });

            // initialize map
            this.map = new Map({
                layers: this.layers.map((item) => item.layer),
                target: 'worldMap',
                view: this.mapView
            });

            // EVENTS LISTENERS
            this.map.on('click', (event) => {
                // determine feature with bigger priority
                const selectedFeatures: Feature[] = this.map.getFeaturesAtPixel(event.pixel);
                let selectFeature: Feature;
                _.each(selectedFeatures, (feature: Feature) => {
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
                            const groupItems: {
                                [id: string]: WorldMapPath | WorldMapMarker
                            } = {};
                            properties.features.forEach((item) => {
                                if (item.getProperties().dataForEventListeners.selected) {
                                    groupItems[item.getProperties().dataForEventListeners.id] = item.getProperties().dataForEventListeners;
                                }
                            });

                            // go through cluster features and determine which overlay data should be hidden and which should be visible
                            const overlayFeatures: Feature[] = this.mapOverlayLayerSource.getFeatures();
                            (overlayFeatures || []).forEach((overlayFeature: Feature) => {
                                // retrieve overlay feature properties
                                const overlayProperties: any = overlayFeature.getProperties ? overlayFeature.getProperties() : null;

                                // do we need to check if we should hide this feature ?
                                if (
                                    !(overlayProperties.dataForEventListeners instanceof WorldMapPath) ||
                                    overlayProperties.clusterGroupFeature !== feature ||
                                    !overlayProperties.dataForEventListeners.hideOnMarkerCluster ||
                                    !overlayProperties.dataForEventListeners.selected
                                ) {
                                    return;
                                }

                                // add feature to list of items to display in dialog
                                groupItems[overlayProperties.dataForEventListeners.id] = overlayProperties.dataForEventListeners;
                            });

                            // do we have clickable items in this group ?
                            if (!_.isEmpty(groupItems)) {
                                // call method for handling groups
                                this.displayChoseFromGroupDialog(Object.values(groupItems));
                            }
                        }
                    } else if (
                        properties.dataForEventListeners &&
                        properties.dataForEventListeners.selected
                    ) {
                        // single record
                        if (
                            properties.dataForEventListeners instanceof WorldMapPath ||
                            properties.dataForEventListeners instanceof WorldMapClusterLine
                        ) {
                            selectFeature = selectFeature ? selectFeature : feature;
                        } else {
                            // anything else is more important than a line
                            selectFeature = feature;
                        }
                    }
                });

                // trigger select
                if (selectFeature) {
                    // call method
                    selectFeature.getProperties().dataForEventListeners.selected(
                        this,
                        selectFeature.getProperties().dataForEventListeners
                    );
                }
            });
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
        });
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
     * Trigger map update and full screen toggle
     */
    fullScreenToggleTrigger() {
        // update map size
        this.updateMapSize();

        // emit value to parent component
        this.fullScreenToggle.emit(this.fullScreenMode);
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
     * Display dialog to choose from list of items from a group
     * @param items
     */
    private displayChoseFromGroupDialog(items: (WorldMapPath | WorldMapMarker)[]) {
        // only one item in the list, then we need to display it
        if (items.length < 2) {
            const item: WorldMapPath | WorldMapMarker = items[0];
            (item as any).selected(
                this,
                item
            );

            // finished
            return;
        }

        // split items into markers & paths
        const markers: WorldMapMarker[] = [];
        const paths: WorldMapPath[] = [];
        items.forEach((item) => {
            if (item instanceof WorldMapMarker) {
                markers.push(item);
            } else {
                paths.push(item);
            }
        });

        // construct list of markers & relationships
        const fieldList: DialogField[] = [];

        // do we have any markers ?
        if (!_.isEmpty(markers)) {
            // markers section title
            if (this.groupMarkerTitle) {
                fieldList.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.SECTION_TITLE,
                    placeholder: this.groupMarkerTitle
                }));
            }

            // add markers to the list
            markers.forEach((item: WorldMapMarker) => {
                fieldList.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: item.label,
                    actionData: item,
                    actionCallback: (marker: WorldMapMarker) => {
                        if (marker.selected) {
                            marker.selected(
                                this,
                                marker
                            );
                        }
                    }
                }));
            });
        }

        // do we have any paths ?
        if (!_.isEmpty(paths)) {
            // paths section title
            if (this.groupPathTitle) {
                fieldList.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.SECTION_TITLE,
                    placeholder: this.groupPathTitle
                }));
            }

            // add paths to the list
            paths.forEach((item: WorldMapPath) => {
                fieldList.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: item.label,
                    actionData: item,
                    actionCallback: (path: WorldMapPath) => {
                        if (path.selected) {
                            path.selected(
                                this,
                                path
                            );
                        }
                    }
                }));
            });
        }



        // display dialog if necessary
        if (this.groupDataDialogHandler) {
            this.groupDataDialogHandler.componentInstance.addFields(
                fieldList
            );
        } else {
            // display dialog to choose item from list
            this.groupDataDialogHandler = this.dialogService
                .showInputDialog(new DialogConfiguration({
                    message: 'LNG_PAGE_WORLD_MAP_GROUP_DIALOG_TITLE',
                    buttons: [
                        new DialogButton({
                            label: 'LNG_COMMON_BUTTON_CLOSE',
                            clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                dialogHandler.close();
                            }
                        })
                    ],
                    fieldsList: fieldList
                }));

            // display dialog
            this.groupDataDialogHandler
                .afterClosed()
                .subscribe(() => {
                    // group dialog closed
                    this.groupDataDialogHandler = undefined;
                });
        }
    }

    /**
     * Update map size
     */
    @HostListener('window:resize')
    private updateMapSizeOnWindowResize() {
        this.updateMapSize();
    }
}
