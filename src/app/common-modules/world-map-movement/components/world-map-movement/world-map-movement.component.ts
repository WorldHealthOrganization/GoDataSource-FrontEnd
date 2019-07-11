import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import * as _ from 'lodash';
import { WorldMapComponent, WorldMapMarker, WorldMapPath, WorldMapPathType, WorldMapPoint } from '../../../world-map/components/world-map/world-map.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as FileSaver from 'file-saver';
import { EntityType } from '../../../../core/models/entity-type';
import { moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-world-map-movement',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './world-map-movement.component.html',
    styleUrls: ['./world-map-movement.component.less']
})
export class WorldMapMovementComponent {
    @Input() width: string = '100%';
    @Input() height: string = '400px';

    @ViewChild(WorldMapComponent) worldMapComponent: WorldMapComponent;

    markers: WorldMapMarker[] = [];
    arrowLines: WorldMapPath[] = [];

    selectedGeoPoint: WorldMapPoint;

    constructor (
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {

    }

    private _addresses: AddressModel[] = [];
    @Input() set addresses(items: AddressModel[]) {
        // init
        this.markers = [];
        const path = new WorldMapPath({
            points: [],
            type: WorldMapPathType.ARROW
        });
        this.arrowLines = [ path ];

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
            this.markers.push(new WorldMapMarker({
                point: new WorldMapPoint(
                    item.geoLocation.lat,
                    item.geoLocation.lng
                ),
                label: (index + 1).toString()
            }));

            // display lines only between usual place addresses ( current & history )
            const currentAddress = new AddressModel(item);
            if (
                currentAddress.typeId === AddressType.CURRENT_ADDRESS ||
                currentAddress.typeId === AddressType.PREVIOUS_ADDRESS
            ) {
                // add arrow line point path
                path.add(new WorldMapPoint(
                    currentAddress.geoLocation.lat,
                    currentAddress.geoLocation.lng
                ));

                // return address item
                previousAddress = currentAddress;
            }

            // finished
            return currentAddress;
        }).value();

        // set center to first item
        if (!_.isEmpty(this.markers)) {
            this.selectedGeoPoint = this.markers[0].point;
        }
    }
    get addresses(): AddressModel[] {
        return this._addresses;
    }

    /**
     * Change map position
     * @param index
     */
    gotoLocation(index: number) {
        // force center
        this.selectedGeoPoint = new WorldMapPoint(
            this.markers[index].point.latitude,
            this.markers[index].point.longitude
        );
    }

    /**
     * Zoom in / out & center to view all markers
     */
    public fitMarkerBounds() {
        if (this.worldMapComponent) {
            this.worldMapComponent.fitMarkerBounds();
        }
    }

    /**
     * Export entity movement
     */
    exportMovementMap(entityType: EntityType) {
        if (this.worldMapComponent) {
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.worldMapComponent
                .printToBlob()
                .subscribe((blob) => {
                    const fileName = this.i18nService.instant(
                        entityType === EntityType.CASE ?
                            'LNG_PAGE_VIEW_MOVEMENT_CASE_TITLE' :
                            'LNG_PAGE_VIEW_MOVEMENT_CONTACT_TITLE');
                    FileSaver.saveAs(
                        blob,
                        `${fileName}.png`
                    );
                    loadingDialog.close();
                });
        }
    }
}
