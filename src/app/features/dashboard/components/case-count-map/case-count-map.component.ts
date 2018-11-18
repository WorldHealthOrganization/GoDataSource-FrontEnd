import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CanvasGantt, StrGantt, SVGGantt } from 'gantt';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { CaseModel } from '../../../../core/models/case.model';
import { AddressType } from '../../../../core/models/address.model';
import { WorldMapMarker, WorldMapMarkerLayer, WorldMapPoint } from '../../../../shared/components/world-map/world-map.component';
import * as _ from 'lodash';

@Component({
    selector: 'app-case-count-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-count-map.component.html',
    styleUrls: ['./case-count-map.component.less']
})
export class CaseCountMapComponent implements OnInit {
    // outbreak
    outbreakId: string;

    displayLoading: boolean = true;

    markers: WorldMapMarker[] = [];

    // constants
    WorldMapMarkerLayer = WorldMapMarkerLayer;

    clusterDistance: number = 10;

    /**
     * Constructor
     */
    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;

                    // re-load the list when the Selected Outbreak is changed
                    this.reloadCases();
                }
            });
    }

    /**
     * Reload case data
     */
    reloadCases() {
        if (this.outbreakId) {
            // display loading
            this.displayLoading = true;

            // configure case search criteria
            const qb = new RequestQueryBuilder();
            qb.filter.where({
                addresses: {
                    elemMatch: {
                        typeId: AddressType.CURRENT_ADDRESS,
                        'geoLocation.coordinates': {
                            $exists: true
                        }
                    }
                }
            });

            // retrieve cases
            this.caseDataService
                .getCasesList(this.outbreakId, qb)
                .subscribe((cases: CaseModel[]) => {
                    // reset data
                    this.markers = [];

                    // add markers
                    _.each(cases, (caseData: CaseModel) => {
                        // find current address
                        const address = _.find(caseData.addresses, { typeId: AddressType.CURRENT_ADDRESS });

                        // add marker
                        this.markers.push(new WorldMapMarker({
                            point: new WorldMapPoint(
                                address.geoLocation.lat,
                                address.geoLocation.lng
                            ),
                            layer: WorldMapMarkerLayer.CLUSTER
                        }));
                    });

                    // finished
                    this.displayLoading = false;
                });
        }
    }
}
