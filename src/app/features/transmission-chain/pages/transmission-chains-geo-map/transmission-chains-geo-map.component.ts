import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { } from '@types/googlemaps';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

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
            this.transmissionChainDataService
                .getIndependentTransmissionChainsList(
                    this.selectedOutbreak.id
                )
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe((chainData: TransmissionChainModel[]) => {
                    console.log(chainData);
                });
        }
    }
}
