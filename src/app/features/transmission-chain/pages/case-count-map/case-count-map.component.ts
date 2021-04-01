import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { WorldMapComponent, WorldMapMarker, WorldMapMarkerLayer, WorldMapPoint } from '../../../../common-modules/world-map/components/world-map/world-map.component';
import * as _ from 'lodash';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Subscription, throwError } from 'rxjs';
import { TransmissionChainFilters } from '../../components/transmission-chains-filters/transmission-chains-filters.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as FileSaver from 'file-saver';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

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
    TransmissionChainModel = TransmissionChainModel;

    // authenticated user
    authUser: UserModel;

    showSettings: boolean = true;
    firstLoaded: boolean = false;
    filters: TransmissionChainFilters = new TransmissionChainFilters();

    clusterDistance: number = 10;

    @ViewChild('worldMap') worldMap: WorldMapComponent;

    // subscribers
    outbreakSubscriber: Subscription;

    /**
     * Constructor
     */
    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;

                    // re-load the list when the Selected Outbreak is changed
                    if (this.firstLoaded) {
                        this.reloadCases();
                    }
                }
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
     * Export case count map
     */
    exportCaseCountMap() {
        if (this.worldMap) {
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.worldMap
                .printToBlob()
                .subscribe((blob) => {
                    const fileName = this.i18nService.instant('LNG_PAGE_CASE_COUNT_TITLE');
                    FileSaver.saveAs(
                        blob,
                        `${fileName}.png`
                    );
                    loadingDialog.close();
                });
        }
    }

    /**
     * Reload case data
     */
    reloadCases() {
        if (this.outbreakId) {
            // hide filters
            this.showSettings = false;
            this.firstLoaded = true;

            // display loading
            this.displayLoading = true;

            // configure case search criteria
            const qb = new RequestQueryBuilder();

            // add custom filters
            if (!_.isEmpty(this.filters)) {
                this.filters.attachConditionsToRequestQueryBuilder(qb);
            }

            // retrieve addresses
            this.caseDataService
                .getCaseCountMapAddresses(this.outbreakId, qb)
                .pipe(
                    catchError((err) => {
                        // show error
                        this.snackbarService.showApiError(err);

                        // hide loading
                        this.displayLoading = false;
                        return throwError(err);
                    })
                )
                .subscribe((geoPoints) => {
                    // reset data
                    this.markers = [];

                    // add markers
                    (geoPoints || []).forEach((geoPoint) => {
                        // add marker
                        this.markers.push(new WorldMapMarker({
                            point: new WorldMapPoint(
                                geoPoint.lat,
                                geoPoint.lng
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
     * Reset Filters
     */
    resetFilters() {
        this.filters = new TransmissionChainFilters();
        setTimeout(() => {
            this.reloadCases();
        });
    }
}
