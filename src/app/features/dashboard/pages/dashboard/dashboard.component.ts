import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import * as _ from 'lodash';
import { DashletSettingsModel, UserSettingsDashboardModel } from '../../../../core/models/user-settings-dashboard.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Observable } from 'rxjs/Observable';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DomService } from '../../../../core/services/helper/dom.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as domtoimage from 'dom-to-image';
import * as FileSaver from 'file-saver';
import { AppliedFilterModel, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { Moment } from 'moment';
import * as moment from 'moment';
import { LoadingDialogModel } from '../../../../shared/components';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-dashboard',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_DASHBOARD_TITLE', '.', true)
    ];

    kpiGroups = [
        // Cases KPIs
        {
            id: DashboardKpiGroup.CASE,
            title: 'LNG_PAGE_DASHBOARD_CASES_KPI_TITLE',
            dashlets: [
                DashboardDashlet.CASES_DECEASED,
                DashboardDashlet.CASES_HOSPITALISED,
                DashboardDashlet.CASES_WITH_LESS_THAN_X_CONTACTS,
                DashboardDashlet.SUSPECT_CASES_REFUSING_TO_BE_TRANSFERRED_TO_A_TREATMENT_UNIT,
                DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_AMONG_KNOWN_CONTACTS,
                DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_IN_KNOWN_TRANSMISSION_CHAINS,
                DashboardDashlet.SUSPECT_CASES_WITH_PENDING_LAB_RESULT,
                DashboardDashlet.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS
            ]
        },
        // Contacts KPIs
        {
            id: DashboardKpiGroup.CONTACT,
            title: 'LNG_PAGE_DASHBOARD_CONTACTS_KPI_TITLE',
            dashlets: [
                DashboardDashlet.CONTACTS_PER_CASE_MEAN,
                DashboardDashlet.CONTACTS_PER_CASE_MEDIAN,
                DashboardDashlet.CONTACTS_ON_THE_FOLLOW_UP_LIST,
                DashboardDashlet.CONTACTS_LOST_TO_FOLLOW_UP,
                DashboardDashlet.CONTACTS_NOT_SEEN_IN_X_DAYS,
                DashboardDashlet.CONTACTS_BECOMING_CASES_IN_TIME_AND_SPACE,
                DashboardDashlet.CONTACTS_SEEN_EACH_DAY,
                DashboardDashlet.CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP
            ]
        },
        // Transmission Chains KPIs
        {
            id: DashboardKpiGroup.TRANSMISSION_CHAIN,
            title: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_KPI_TITLE',
            dashlets: [
                DashboardDashlet.INDEPENDENT_TRANSMISSION_CHAINS,
                DashboardDashlet.ACTIVE_TRANSMISSION_CHAINS,
                DashboardDashlet.TRANSMISSION_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES
            ]
        }
    ];

    // authenticated user
    authUser: UserModel;

    // provide constants to template
    DashboardDashlet = DashboardDashlet;

    selectedOutbreak: OutbreakModel;

    // flag if there aren't any outbreaks in the system
    noOutbreaksInSystem: boolean = false;

    // constants
    ExportDataExtension = ExportDataExtension;

    casesByClassificationAndLocationReportUrl: string = '';
    contactsFollowupSuccessRateReportUrl: string = '';

    loadingDialog: LoadingDialogModel;

    // filters
    globalFilterDate: Moment = moment();
    globalFilterLocationId: string;
    globalFilterDateMin: Moment = moment().add(-60, 'days').startOf('day');
    globalFilterDateMax: Moment = moment().endOf('day');

    @ViewChild('kpiSection') private kpiSection: ElementRef;

    // subscribers
    outbreakSubscriber: Subscription;

    constructor(
        private authDataService: AuthDataService,
        private userDataService: UserDataService,
        private outbreakDataService: OutbreakDataService,
        private domService: DomService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.initializeDashlets();

        // get Outbreaks list to check if there are any in the system
        this.outbreakDataService.getOutbreaksList()
            .subscribe((outbreaksList) => {
                this.noOutbreaksInSystem = outbreaksList.length === 0;
            });

        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.casesByClassificationAndLocationReportUrl = `/outbreaks/${this.selectedOutbreak.id}/cases/per-classification-per-location-level-report/download/`;
                    this.contactsFollowupSuccessRateReportUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/per-location-level-tracing-report/download/`;
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

    private initializeDashlets() {
        const userDashboardSettings: UserSettingsDashboardModel = this.authUser.getSettings(UserSettings.DASHBOARD);
        _.each(this.kpiGroups, (group) => {
            _.each(group.dashlets, (dashlet) => {
                // add the dashlet to the list (if it's not already existing)
                userDashboardSettings.addDashletIfNotExists(new DashletSettingsModel({
                    name: dashlet,
                    kpiGroup: group.id
                }));
            });
        });

        this.refreshDashletsOrder();

        // persist changes
        this.persistUserDashboardSettings().subscribe();
    }

    /**
     * Update dashlets order based on authenticated user's settings
     */
    private refreshDashletsOrder() {
        const dashboardSettings = this.authUser.getSettings(UserSettings.DASHBOARD);
        _.each(this.kpiGroups, (group) => {
            group.dashlets.sort((a, b) => {
                const dashletA = dashboardSettings.getDashlet(a);
                const dashletB = dashboardSettings.getDashlet(b);

                if (dashletA && dashletB) {
                    return dashletA.order - dashletB.order;
                } else {
                    return 1;
                }
            });
        });
    }

    /**
     * Persist user's settings for the dashboard
     */
    private persistUserDashboardSettings(): Observable<any> {
        return this.authDataService.updateSettingsForCurrentUser(
            UserSettings.DASHBOARD,
            this.authUser.getSettings(UserSettings.DASHBOARD)
        );
    }

    /**
     * Check if a dashlet is visible for current user
     * @param name
     */
    isDashletVisible(name: string): boolean {
        return _.get(
            this.authUser.getSettings(UserSettings.DASHBOARD).getDashlet(name),
            'visible',
            true
        );
    }

    /**
     * Hide a dashlet for current user
     * @param name
     */
    hideDashlet(name: string) {
        this.authUser.getSettings(UserSettings.DASHBOARD).hideDashlet(name);

        this.refreshDashletsOrder();

        // persist changes
        this.persistUserDashboardSettings().subscribe();
    }

    moveDashletBefore(name: string) {
        this.authUser.getSettings(UserSettings.DASHBOARD).moveDashletBefore(name);

        this.refreshDashletsOrder();

        // persist changes
        this.persistUserDashboardSettings().subscribe();
    }

    moveDashletAfter(name: string) {
        this.authUser.getSettings(UserSettings.DASHBOARD).moveDashletAfter(name);

        this.refreshDashletsOrder();

        // persist changes
        this.persistUserDashboardSettings().subscribe();
    }

    showAllDashlets(kpiGroup: string) {
        this.authUser.getSettings(UserSettings.DASHBOARD).showAllDashlets(kpiGroup);

        // persist changes
        this.persistUserDashboardSettings().subscribe();
    }

    /**
     * Check if the user has read access to contacts
     * @returns {boolean}
     */
    hasReadContactPermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CONTACT);
    }

    /**
     * Check if the user has read access to cases
     * @returns {boolean}
     */
    hasReadCasePermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Check if the user has read report permission
     * @returns {boolean}
     */
    hasReadReportPermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_REPORT);
    }

    /**
     * generate EPI curve report - image will be exported as pdf
     */
    generateEpiCurveReport() {
        this.showLoadingDialog();
        this.domService
            .getPNGBase64('app-epi-curve-dashlet svg', '#tempCanvas')
            .subscribe((pngBase64) => {
                this.importExportDataService.exportImageToPdf({image: pngBase64, responseType: 'blob', splitFactor: 1})
                    .subscribe((blob) => {
                        this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_EPI_CURVE_REPORT_LABEL');
                });
            });
    }

    /**
     * Generate KPIs report
     */
    generateKpisReport() {
        this.showLoadingDialog();
        domtoimage.toPng(this.kpiSection.nativeElement)
            .then((dataUrl) => {
                const dataBase64 = dataUrl.replace('data:image/png;base64,', '');

                this.importExportDataService.exportImageToPdf({image: dataBase64, responseType: 'blob', splitFactor: 1})
                    .subscribe((blob) => {
                        this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_KPIS_REPORT_LABEL');
                    });
            });
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
        this.closeLoadingDialog();
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
     * Cases by classification and location qb
     */
    qbCaseByClassification(): RequestQueryBuilder {
        // initialization
        const qb = new RequestQueryBuilder();

        // date
        if (this.globalFilterDate) {
            qb.filter.byDateRange(
                'dateOfOnset', {
                    endDate: this.globalFilterDate.endOf('day').format()
                }
            );
        }

        // location
        if (this.globalFilterLocationId) {
            qb.filter.byEquality(
                'addresses.parentLocationIdFilter',
                this.globalFilterLocationId
            );
        }

        // finished
        return qb;
    }

    /**
     * Contacts follow up success rate
     */
    qbContactsFollowUpSuccessRate(): RequestQueryBuilder {
        // initialization
        const qb = new RequestQueryBuilder();

        // date
        if (this.globalFilterDate) {
            qb.filter.byDateRange(
                'dateOfReporting', {
                    endDate: this.globalFilterDate.endOf('day').format()
                }
            );
        }

        // location
        if (this.globalFilterLocationId) {
            qb.filter.byEquality(
                'addresses.parentLocationIdFilter',
                this.globalFilterLocationId
            );
        }

        // finished
        return qb;
    }
}
