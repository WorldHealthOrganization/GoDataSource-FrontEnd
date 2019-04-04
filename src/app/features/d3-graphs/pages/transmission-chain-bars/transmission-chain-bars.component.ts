import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainBarsService } from '../../services/transmission-chain-bars.service';
import { LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import * as domtoimage from 'dom-to-image';
import * as FileSaver from 'file-saver';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TransmissionChainBarsDataService } from '../../services/transmission-chain-bars.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Subscription } from 'rxjs/Subscription';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-transmission-chain-bars',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chain-bars.component.html',
    styleUrls: ['./transmission-chain-bars.component.less']
})
export class TransmissionChainBarsComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE', null, true)
    ];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    outbreakSubscriber: Subscription;
    // query builder for fetching data
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    // show loading while fetching data and building the graph
    loadingData: boolean = false;
    // do we have data to draw the graph?
    noData: boolean = false;
    // loading indicator
    loadingDialog: LoadingDialogModel;
    // show filters?
    filtersVisible: boolean = false;
    // do architecture is x32?
    x32Architecture: boolean = false;
    // models for filters form elements
    filters = {
        dateOfOnset: null,
        isolationDate: null,
        isolationCenterName: null,
        locationId: null
    };

    @ViewChild('chart') chartContainer: ElementRef;

    constructor(
        private authDataService: AuthDataService,
        private transmissionChainBarsService: TransmissionChainBarsService,
        private transmissionChainBarsDataService: TransmissionChainBarsDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        protected snackbarService: SnackbarService,
        private systemSettingsDataService: SystemSettingsDataService
    ) {
    }

    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadGraph();
            });
        // check if platform architecture is x32
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((versionData: SystemSettingsVersionModel) => {
                if (versionData.process.arch === Constants.PLATFORM_ARCH.X32 ) {
                    this.x32Architecture = true;
                }
            });
    }

    ngOnDestroy() {
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * (Re)Build the graph
     */
    private loadGraph() {
        if (!this.selectedOutbreak) {
            return;
        }

        this.loadingData = true;

        this.transmissionChainBarsDataService.getTransmissionChainBarsData(this.selectedOutbreak.id, this.queryBuilder)
            .subscribe((graphData) => {
                this.loadingData = false;

                if (graphData.casesOrder.length > 0) {
                    this.noData = false;
                    this.transmissionChainBarsService.drawGraph(this.chartContainer.nativeElement, graphData);
                } else {
                    this.noData = true;
                }
            });
    }

    /**
     * Display loading dialog
     */
    private showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    private closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }

    /**
     * Export visible chain as PDF
     */
    exportChain() {
        this.showLoadingDialog();

        domtoimage.toPng(this.chartContainer.nativeElement)
            .then((dataUrl) => {
                const dataBase64 = dataUrl.replace('data:image/png;base64,', '');

                this.importExportDataService
                    .exportImageToPdf({image: dataBase64, responseType: 'blob', splitFactor: 1})
                    .catch((err) => {
                        this.snackbarService.showApiError(err);
                        this.closeLoadingDialog();
                        return ErrorObservable.create(err);
                    })
                    .subscribe((blob) => {
                        const fileName = this.i18nService.instant('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE');
                        FileSaver.saveAs(
                            blob,
                            `${fileName}.pdf`
                        );
                        this.closeLoadingDialog();
                    });
            });
    }

    /**
     * Show/Hide filters
     */
    toggleFilters() {
        this.filtersVisible = !this.filtersVisible;
    }

    /**
     * Show/Hide filters button label
     */
    get toggleFiltersButtonLabel(): string {
        return this.filtersVisible ? 'LNG_COMMON_BUTTON_HIDE_FILTERS' : 'LNG_COMMON_BUTTON_SHOW_FILTERS';
    }

    /**
     * Reset filters to initial state and rebuild chain
     */
    resetFilters() {
        // reset filters in UI
        this.filters = {
            dateOfOnset: null,
            locationId: null,
            isolationDate: null,
            isolationCenterName: null
        };

        // reset query builder
        this.queryBuilder.clear();

        // hide filters
        this.filtersVisible = false;

        // rebuild graph
        this.loadGraph();
    }

    /**
     * Apply filters and rebuild chain
     */
    applyFilters() {
        // clear query builder and apply each filter separately
        this.queryBuilder.clear();

        if (this.filters.dateOfOnset !== null) {
            this.queryBuilder.filter
                .byDateRange('dateOfOnset', this.filters.dateOfOnset);
        }

        if (this.filters.locationId !== null) {
            this.queryBuilder.filter
                .where({
                    'addresses.parentLocationIdFilter': {
                        inq: [this.filters.locationId]
                    }
                });
        }

        if (this.filters.isolationDate !== null) {
            // must have isolation start date or end date
            this.queryBuilder.filter
                .where({
                    'or': [
                        {
                            'dateRanges.startDate': {
                                '$ne': null
                            }
                        },
                        {
                            'dateRanges.endDate': {
                                '$ne': null
                            }
                        }
                    ]
                });

            if (this.filters.isolationDate.startDate) {
                const startDate = this.filters.isolationDate.startDate.toISOString();
                this.queryBuilder.filter
                    .where({
                        'or': [
                            {
                                'dateRanges.endDate': {
                                    'gte': startDate
                                }
                            },
                            {
                                'dateRanges.endDate': null
                            }
                        ]
                    });
            }

            if (this.filters.isolationDate.endDate) {
                const endDate = this.filters.isolationDate.endDate.toISOString();
                this.queryBuilder.filter
                    .where({
                        'or': [
                            {
                                'and': [
                                    {
                                        'dateOfOnset': {
                                            'lte': endDate
                                        }
                                    },
                                    {
                                        'dateRanges.startDate': null
                                    }
                                ]
                            },
                            {
                                'and': [
                                    {
                                        'dateRanges.startDate': {
                                            'lte': endDate
                                        }
                                    },
                                    {
                                        'dateRanges.startDate': {
                                            '$ne': null
                                        }
                                    }
                                ]
                            }
                        ]
                    });

            }
        }

        if (this.filters.isolationCenterName !== null) {
            this.queryBuilder.filter
                .byText('dateRanges.centerName', this.filters.isolationCenterName);
        }

        // hide filters
        this.filtersVisible = false;

        // rebuild graph
        this.loadGraph();
    }

    hasCaseReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }
}
