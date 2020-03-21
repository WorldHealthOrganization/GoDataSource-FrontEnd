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
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { throwError } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { Observable } from 'rxjs/internal/Observable';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

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

    // constants
    TransmissionChainModel = TransmissionChainModel;

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    outbreakSubscriber: Subscription;
    // query builder for fetching data
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    // show loading while fetching data and building the graph
    loadingData: boolean = true;
    // do we have data to draw the graph?
    noData: boolean = false;
    // loading indicator
    loadingDialog: LoadingDialogModel;
    // show filters?
    filtersVisible: boolean = false;
    // do architecture is x32?
    x86Architecture: boolean = false;
    // models for filters form elements
    filters: {
        date: any,
        isolationDate: any,
        isolationCenterName: string[],
        locationId: any,
        caseClassification: any,
        caseOutcome: any
    } = {
        date: null,
        isolationDate: null,
        isolationCenterName: null,
        locationId: null,
        caseClassification: null,
        caseOutcome: null
    };

    // define legend colors
    legendColors: any;

    graphData: any;
    cellWidth: number = 91;

    caseClassificationsList$: Observable<LabelValuePair[]>;
    caseOutcomeList$: Observable<LabelValuePair[]>;
    dateRangeCentreNameList$: Observable<LabelValuePair[]>;

    @ViewChild('chart') chartContainer: ElementRef;

    // Map of center token names
    centerTokenToNameMap: {
        [token: string]: string
    } = {};

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private transmissionChainBarsService: TransmissionChainBarsService,
        private transmissionChainBarsDataService: TransmissionChainBarsDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        protected snackbarService: SnackbarService,
        private systemSettingsDataService: SystemSettingsDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // init color rectangles
        this.legendColors = {
            rectCD: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.isolationColor};"></div>`,
            rectLAB: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.labResultColor};"></div>`,
            rectOUT: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.dateOutcomeColor};"></div>`,
            rectB: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.dateOutcomeBurialColor};"></div>`
        };

        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseOutcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);
        this.dateRangeCentreNameList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DATE_RANGE_CENTRE_NAME).pipe(share());

        // outbreak
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
                if (versionData.arch === Constants.PLATFORM_ARCH.X86) {
                    this.x86Architecture = true;
                }
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // release graph data
        this.transmissionChainBarsService.destroy();

        // release subscriber
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

        // load data
        this.loadingData = true;

        // retrieve center names & chain bar data
        forkJoin(
            this.dateRangeCentreNameList$,
            this.transmissionChainBarsDataService.getTransmissionChainBarsData(this.selectedOutbreak.id, this.queryBuilder)
        ).subscribe(([centerNames, graphData]) => {
            // map center names
            centerNames.forEach((center) => {
                this.centerTokenToNameMap[center.value] = this.i18nService.instant(center.label);
            });

            // graph data
            if (graphData.personsOrder.length > 0) {
                this.noData = false;

                this.graphData = graphData;
                this.redrawGraph();
            } else {
                this.noData = true;
            }

            // finished loading data
            this.loadingData = false;
        });
    }

    /**
     * Redraw graph
     */
    redrawGraph() {
        // there is no point in drawing graph if we have no data
        if (this.graphData === undefined) {
            return;
        }

        // draw graph
        this.transmissionChainBarsService.drawGraph(
            this.chartContainer.nativeElement,
            this.graphData,
            this.centerTokenToNameMap, {
                cellWidth: this.cellWidth
            }
        );
    }

    /**
     * Changed cell width
     * @param cellWidth
     */
    cellWidthChanged(cellWidth: number) {
        this.cellWidth = cellWidth;
        this.redrawGraph();
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

        (domtoimage as any).toPng(this.chartContainer.nativeElement)
            .then((dataUrl) => {
                const dataBase64 = dataUrl.replace('data:image/png;base64,', '');

                this.importExportDataService
                    .exportImageToPdf({image: dataBase64, responseType: 'blob', splitFactor: 1})
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showApiError(err);
                            this.closeLoadingDialog();
                            return throwError(err);
                        })
                    )
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
            date: null,
            locationId: null,
            isolationDate: null,
            isolationCenterName: null,
            caseClassification: null,
            caseOutcome: null
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

        // case dateonset / event date filter
        if (
            this.filters.date && (
                this.filters.date.startDate ||
                this.filters.date.endDate
            )
        ) {
            // determine operator & value
            const fromValue = this.filters.date.startDate ? moment(this.filters.date.startDate).toISOString() : null;
            const toValue = this.filters.date.endDate ? moment(this.filters.date.endDate).toISOString() : null;
            let operator: string;
            let valueToCompare: any;
            if (fromValue && toValue) {
                operator = 'between';
                valueToCompare = [fromValue, toValue];
            } else if (fromValue) {
                operator = 'gte';
                valueToCompare = fromValue;
            } else {
                operator = 'lte';
                valueToCompare = toValue;
            }

            // condition
            this.queryBuilder.filter
                .where({
                    or: [
                        {
                            type: EntityType.CASE,
                            dateOfOnset: {
                                [operator]: valueToCompare
                            }
                        }, {
                            type: EntityType.EVENT,
                            date: {
                                [operator]: valueToCompare
                            }
                        }
                    ]
                });
        }

        if (this.filters.locationId !== null) {
            this.queryBuilder.filter
                .where({
                    or: [
                        {
                            type: EntityType.CASE,
                            'addresses.parentLocationIdFilter': {
                                inq: [this.filters.locationId]
                            }
                        }, {
                            type: EntityType.EVENT,
                            'address.parentLocationIdFilter': {
                                inq: [this.filters.locationId]
                            }
                        }
                    ]
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

        // filter by center names
        if (
            this.filters.isolationCenterName &&
            this.filters.isolationCenterName.length > 0
        ) {
            this.queryBuilder.filter
                .bySelect(
                    'dateRanges.centerName',
                    this.filters.isolationCenterName,
                    true,
                    null
                );
        }

        // case classification
        if (this.filters.caseClassification !== null) {
            this.queryBuilder.filter.bySelect(
                'classification',
                this.filters.caseClassification,
                true,
                null
            );
        }

        // case outcome
        if (this.filters.caseOutcome !== null) {
            this.queryBuilder.filter.bySelect(
                'outcomeId',
                this.filters.caseOutcome,
                true,
                null
            );
        }

        // hide filters
        this.filtersVisible = false;

        // rebuild graph
        this.loadGraph();
    }
}
