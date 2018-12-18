import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CanvasGantt, StrGantt, SVGGantt } from 'gantt';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { CaseModel } from '../../../../core/models/case.model';
import { AddressType } from '../../../../core/models/address.model';
import { WorldMapComponent, WorldMapMarker, WorldMapMarkerLayer, WorldMapPoint } from '../../../../shared/components/world-map/world-map.component';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-case-count-map',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-count-map.component.html',
    styleUrls: ['./case-count-map.component.less']
})
export class CaseCountMapComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_CASE_COUNT_TITLE', '', true)
    ];

    // outbreak
    outbreakId: string;

    displayLoading: boolean = true;

    markers: WorldMapMarker[] = [];

    // constants
    WorldMapMarkerLayer = WorldMapMarkerLayer;

    clusterDistance: number = 10;

    @ViewChild('worldMap') worldMap: WorldMapComponent;

    // subscribers
    outbreakSubscriber: Subscription;

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
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;

                    // re-load the list when the Selected Outbreak is changed
                    this.reloadCases();
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
     * Reload case data
     */
    reloadCases() {
        if (this.outbreakId) {
            // display loading
            this.displayLoading = true;

            // configure case search criteria
            const qb = new RequestQueryBuilder();

            // only address information is needed
            qb.fields('addresses');

            // only current addresses with geo location are relevant
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

    /**
     * Print to blob
     */
    printToBlob(): Observable<Blob> {
        return Observable.create((observer: Subscriber<Blob>) => {
            if (this.worldMap) {
                this.worldMap
                    .printToBlob()
                    .subscribe((blob) => {
                        observer.next(blob);
                        observer.complete();
                    });
            } else {
                observer.next(null);
                observer.complete();
            }
        });
    }
}
