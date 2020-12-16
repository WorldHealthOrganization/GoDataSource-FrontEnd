import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { AppliedFilterModel, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import * as _ from 'lodash';
import { DomService } from '../../../../core/services/helper/dom.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as FileSaver from 'file-saver';
import { LoadingDialogModel } from '../../../../shared/components/index';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { GanttChartDelayOnsetDashletComponent } from '../../components/gantt-chart-delay-onset-dashlet/gantt-chart-delay-onset-dashlet.component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { GanttChartModel } from '../../../../core/models/gantt-chart.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-gantt-chart',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './gantt-chart.component.html',
    styleUrls: ['./gantt-chart.component.less']
})
export class GanttChartComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak ID
    outbreakId: string;

    // available side filters
    availableSideFilters: FilterModel[] = [];

    globalFilterDate: Moment;
    globalFilterLocationId: string;
    loadingDialog: LoadingDialogModel;

    @ViewChild('ganttChart') private ganttChart: GanttChartDelayOnsetDashletComponent;

    ganttChartTypes: Observable<any[]>;
    ganttChartType: any;

    // constants
    Constants = Constants;
    GanttChartModel = GanttChartModel;

    // do architecture is x32?
    x86Architecture: boolean = false;

    // authenticated user
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private domService: DomService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        protected snackbarService: SnackbarService,
        private systemSettingsDataService: SystemSettingsDataService,
        private authDataService: AuthDataService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize Side Filters
        this.initializeSideFilters();

        // load gantt types
        this.ganttChartTypes = this.genericDataService
            .getGanttChartTypes()
            .pipe(
                map((records: LabelValuePair[]) => {
                    return records.filter((record: LabelValuePair): boolean => {
                        switch (record.value) {
                            case Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value:
                                return GanttChartModel.canViewDelayOnsetLabTesting(this.authUser);
                            case Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value:
                                return GanttChartModel.canViewDelayOnsetHospitalization(this.authUser);
                            default:
                                // not supported
                                return false;
                        }
                    });
                })
            );

        // check if platform architecture is x32
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((versionData: SystemSettingsVersionModel) => {
                if (versionData.arch === Constants.PLATFORM_ARCH.X86) {
                    this.x86Architecture = true;
                }
            });

        // select visible chart accordingly to user rights
        if (GanttChartModel.canViewDelayOnsetLabTesting(this.authUser)) {
            this.ganttChartType = Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value;
        } else if (GanttChartModel.canViewDelayOnsetHospitalization(this.authUser)) {
            this.ganttChartType = Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value;
        } else {
            // NOT SUPPORTED
        }

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // set current page title
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_GANTT_CHART_TITLE', '/gantt-chart')
        );
    }

    /**
     * Initialize Side Filters
     */
    private initializeSideFilters() {
        // set available side filters
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'locationId',
                fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION',
                type: FilterType.LOCATION,
                required: true,
                multipleOptions: false
            }),
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_DATE',
                type: FilterType.DATE,
                required: true,
                maxDate: moment()
            })
        ];
    }

    /**
     * Apply side filters
     * @param data
     */
    applySideFilters(filters: AppliedFilterModel[]) {
        // retrieve date & location filters
        // retrieve location filter
        const dateFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'date' } });
        const locationFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'locationId' } });

        // set filters
        this.globalFilterDate = _.isEmpty(dateFilter.value) ? undefined : moment(dateFilter.value);
        this.globalFilterLocationId = _.isEmpty(locationFilter.value) ? undefined : locationFilter.value;
    }

    /**
     * generate Gantt chart report - image will be exported as pdf
     */
    generateGanttChartReport() {
        // check if we have data to export
        if (
            !this.ganttChart ||
            !this.ganttChart.hasData()
        ) {
            this.snackbarService.showError('LNG_PAGE_DASHLET_GANTT_CHART_NO_DATA_LABEL');
        } else {
            this.showLoadingDialog();
            let ganttChartName = 'app-gantt-chart-delay-onset-dashlet svg';
            if (this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value) {
                ganttChartName = 'app-gantt-chart-delay-onset-hospitalization-dashlet svg';
            }

            // export graph as png image
            this.domService
                .getPNGBase64(ganttChartName, '#tempCanvas')
                .subscribe((pngBase64) => {
                    this.importExportDataService
                        .exportImageToPdf({image: pngBase64, responseType: 'blob', splitFactor: 1})
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                this.closeLoadingDialog();
                                return throwError(err);
                            })
                        )
                        .subscribe((blob) => {
                            this.downloadFile(blob, 'LNG_PAGE_GANTT_CHART_REPORT_LABEL');
                            this.closeLoadingDialog();
                        });
                });
        }
    }

    /**
     * Download File
     * @param blob
     * @param fileNameToken
     */
    private downloadFile(
        blob,
        fileNameToken,
        extension: string = 'pdf'
    ) {
        const fileName = this.i18nService.instant(fileNameToken);
        FileSaver.saveAs(
            blob,
            `${fileName}.${extension}`
        );
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }

    /**
     * Switch between gantt types
     */
    updateChartType($event) {
        this.ganttChartType = $event.value;
    }
}
