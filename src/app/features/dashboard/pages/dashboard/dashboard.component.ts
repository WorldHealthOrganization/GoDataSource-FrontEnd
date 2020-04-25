import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DashboardDashlet, DashboardKpiGroup } from '../../../../core/enums/dashboard.enum';
import * as _ from 'lodash';
import { DashletSettingsModel, UserSettingsDashboardModel } from '../../../../core/models/user-settings-dashboard.model';
import { Observable ,  Subscription } from 'rxjs';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DomService } from '../../../../core/services/helper/dom.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as domtoimage from 'dom-to-image';
import * as FileSaver from 'file-saver';
import { AppliedFilterModel, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { LoadingDialogModel } from '../../../../shared/components';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Constants } from '../../../../core/models/constants';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, map, share } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DashboardModel } from '../../../../core/models/dashboard.model';

interface IKpiGroup {
    id: DashboardKpiGroup;
    title: string;
    dashlets: DashboardDashlet[];
    hasAccess: (user: UserModel) => boolean;
    permissions: {
        [dashboardDashlet: string]: {
            hasAccess: (user: UserModel) => boolean
        }
    };
}

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

    kpiGroups: IKpiGroup[] = [
        // Cases KPIs
        {
            id: DashboardKpiGroup.CASE,
            title: 'LNG_PAGE_DASHBOARD_CASES_KPI_TITLE',
            dashlets: [
                DashboardDashlet.CASES_DECEASED,
                DashboardDashlet.CASES_HOSPITALISED,
                DashboardDashlet.CASES_WITH_LESS_THAN_X_CONTACTS,
                DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_AMONG_KNOWN_CONTACTS,
                DashboardDashlet.SUSPECT_CASES_REFUSING_TO_BE_TRANSFERRED_TO_A_TREATMENT_UNIT,
                DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_OUTSIDE_THE_TRANSMISSION_CHAINS,
                DashboardDashlet.SUSPECT_CASES_WITH_PENDING_LAB_RESULT,
                DashboardDashlet.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS
            ],
            hasAccess: (user: UserModel): boolean => {
                // can we check fo group permissions ?
                if (
                    !this.kpiGroupsMap ||
                    !this.kpiGroupsMap[DashboardKpiGroup.CASE]
                ) {
                    return false;
                }

                // check that we have at least one group permission
                const group: IKpiGroup = this.kpiGroupsMap[DashboardKpiGroup.CASE];
                for (const dashletKey in group.permissions) {
                    if (group.permissions[dashletKey].hasAccess(user)) {
                        return true;
                    }
                }

                // we don't have rights in this group
                return false;
            },
            permissions: {
                [DashboardDashlet.CASES_DECEASED]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCaseDeceasedDashlet(user);
                    }
                },
                [DashboardDashlet.CASES_HOSPITALISED]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCaseHospitalizedDashlet(user);
                    }
                },
                [DashboardDashlet.CASES_WITH_LESS_THAN_X_CONTACTS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCaseWithLessThanXCotactsDashlet(user);
                    }
                },
                [DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_AMONG_KNOWN_CONTACTS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(user);
                    }
                },
                [DashboardDashlet.SUSPECT_CASES_REFUSING_TO_BE_TRANSFERRED_TO_A_TREATMENT_UNIT]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCasesRefusingTreatmentDashlet(user);
                    }
                },
                [DashboardDashlet.NEW_CASES_IN_THE_PREVIOUS_X_DAYS_OUTSIDE_THE_TRANSMISSION_CHAINS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewNewCasesFromKnownCOTDashlet(user);
                    }
                },
                [DashboardDashlet.SUSPECT_CASES_WITH_PENDING_LAB_RESULT]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCasesWithPendingLabResultsDashlet(user);
                    }
                },
                [DashboardDashlet.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewCasesNotIdentifiedThroughContactsDashlet(user);
                    }
                }
            }
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
            ],
            hasAccess: (user: UserModel): boolean => {
                // can we check fo group permissions ?
                if (
                    !this.kpiGroupsMap ||
                    !this.kpiGroupsMap[DashboardKpiGroup.CONTACT]
                ) {
                    return false;
                }

                // check that we have at least one group permission
                const group: IKpiGroup = this.kpiGroupsMap[DashboardKpiGroup.CONTACT];
                for (const dashletKey in group.permissions) {
                    if (group.permissions[dashletKey].hasAccess(user)) {
                        return true;
                    }
                }

                // we don't have rights in this group
                return false;
            },
            permissions: {
                [DashboardDashlet.CONTACTS_PER_CASE_MEAN]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsPerCaseMeanDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_PER_CASE_MEDIAN]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsPerCaseMedianDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_ON_THE_FOLLOW_UP_LIST]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsFromFollowUpsDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_LOST_TO_FOLLOW_UP]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsLostToFollowUpsDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_NOT_SEEN_IN_X_DAYS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsNotSeenInXDaysDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_BECOMING_CASES_IN_TIME_AND_SPACE]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsBecomeCasesDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_SEEN_EACH_DAY]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsSeenDashlet(user);
                    }
                },
                [DashboardDashlet.CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewContactsWithSuccessfulFollowUpsDashlet(user);
                    }
                }
            }
        },
        // Transmission Chains KPIs
        {
            id: DashboardKpiGroup.TRANSMISSION_CHAIN,
            title: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_KPI_TITLE',
            dashlets: [
                DashboardDashlet.INDEPENDENT_TRANSMISSION_CHAINS,
                DashboardDashlet.ACTIVE_TRANSMISSION_CHAINS,
                DashboardDashlet.TRANSMISSION_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES
            ],
            hasAccess: (user: UserModel): boolean => {
                // can we check fo group permissions ?
                if (
                    !this.kpiGroupsMap ||
                    !this.kpiGroupsMap[DashboardKpiGroup.TRANSMISSION_CHAIN]
                ) {
                    return false;
                }

                // check that we have at least one group permission
                const group: IKpiGroup = this.kpiGroupsMap[DashboardKpiGroup.TRANSMISSION_CHAIN];
                for (const dashletKey in group.permissions) {
                    if (group.permissions[dashletKey].hasAccess(user)) {
                        return true;
                    }
                }

                // we don't have rights in this group
                return false;
            },
            permissions: {
                [DashboardDashlet.INDEPENDENT_TRANSMISSION_CHAINS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewIndependentCOTDashlet(user);
                    }
                },
                [DashboardDashlet.ACTIVE_TRANSMISSION_CHAINS]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewActiveCOTDashlet(user);
                    }
                },
                [DashboardDashlet.TRANSMISSION_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES]: {
                    hasAccess: (user: UserModel): boolean => {
                        return DashboardModel.canViewNewChainsFromContactsWhoBecameCasesDashlet(user);
                    }
                }
            }
        }
    ];
    kpiGroupsMap: {
        [id: string]: IKpiGroup
    } = {};

    // authenticated user
    authUser: UserModel;

    // provide constants to template
    DashboardDashlet = DashboardDashlet;
    DashboardModel = DashboardModel;

    selectedOutbreak: OutbreakModel;

    // flag if there aren't any outbreaks in the system
    noOutbreaksInSystem: boolean = false;
    // do architecture is x32?
    x86Architecture: boolean = false;

    // constants
    ExportDataExtension = ExportDataExtension;

    casesByClassificationAndLocationReportUrl: string = '';
    contactsFollowupSuccessRateReportUrl: string = '';

    loadingDialog: LoadingDialogModel;

    // available side filters
    availableSideFilters: FilterModel[] = [];

    globalFilterDate: Moment = moment();
    globalFilterLocationId: string;
    globalFilterClassificationId: string[] = [];

    @ViewChild('kpiSection') private kpiSection: ElementRef;

    // subscribers
    outbreakSubscriber: Subscription;

    Constants = Constants;

    epiCurveViewType;
    epiCurveViewTypes$: Observable<any[]>;

    caseClassificationsList$: Observable<LabelValuePair[]>;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private domService: DomService,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService,
        protected snackbarService: SnackbarService,
        private systemSettingsDataService: SystemSettingsDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // map kpi groups
        this.kpiGroupsMap = {};
        this.kpiGroups.forEach((group) => {
            this.kpiGroupsMap[group.id] = group;
        });

        this.caseClassificationsList$ = this.referenceDataDataService
            .getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION)
            .pipe(
                map((records: LabelValuePair[]) => {
                    return _.filter(
                        records,
                        (record: LabelValuePair) => {
                            return record.value !== Constants.CASE_CLASSIFICATION.NOT_A_CASE;
                        }
                    );
                }),
                share()
            );

        this.initializeDashlets();

        // get Outbreaks list to check if there are any in the system
        this.outbreakDataService
            .getOutbreaksCount()
            .subscribe((outbreaksCount) => {
                this.noOutbreaksInSystem = !outbreaksCount.count;
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

        // check if platform architecture is x32
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((versionData: SystemSettingsVersionModel) => {
                if (versionData.arch === Constants.PLATFORM_ARCH.X86) {
                    this.x86Architecture = true;
                }
            });

        // load epi curves types
        this.epiCurveViewTypes$ = this.genericDataService
            .getEpiCurvesTypes()
            .pipe(map((data: LabelValuePair[]) => {
                // keep only those types to which we have access
                return data.filter((item: LabelValuePair): boolean => {
                    switch (item.value) {
                        case Constants.EPI_CURVE_TYPES.CLASSIFICATION.value:
                            return DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this.authUser);
                        case Constants.EPI_CURVE_TYPES.OUTCOME.value:
                            return DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this.authUser);
                        case Constants.EPI_CURVE_TYPES.REPORTING.value:
                            return DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this.authUser);
                        default:
                            // NOT SUPPORTED
                            return false;
                    }
                });
            }));

        // set default epi curve
        if (DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this.authUser)) {
            this.epiCurveViewType = Constants.EPI_CURVE_TYPES.CLASSIFICATION.value;
        } else if (DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this.authUser)) {
            this.epiCurveViewType = Constants.EPI_CURVE_TYPES.OUTCOME.value;
        } else if (DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this.authUser)) {
            this.epiCurveViewType = Constants.EPI_CURVE_TYPES.REPORTING.value;
        } else {
            // NOT SUPPORTED
        }

        // initialize Side Filters
        this.initializeSideFilters();
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
                multipleOptions: false,
                value: this.globalFilterLocationId
            }),
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_DATE',
                type: FilterType.DATE,
                required: true,
                maxDate: moment(),
                value: this.globalFilterDate
            }),
            new FilterModel({
                fieldName: 'classificationId',
                fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_CLASSIFICATION',
                type: FilterType.MULTISELECT,
                required: true,
                options$: this.caseClassificationsList$,
                value: this.globalFilterClassificationId
            })
        ];
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
     * generate EPI curve report - image will be exported as pdf
     */
    generateEpiCurveReport() {
        this.showLoadingDialog();
        switch (this.epiCurveViewType) {
            case Constants.EPI_CURVE_TYPES.CLASSIFICATION.value:
                this.getEpiCurveDashlet('app-epi-curve-dashlet svg');
                break;
            case Constants.EPI_CURVE_TYPES.OUTCOME.value:
                this.getEpiCurveDashlet('app-epi-curve-outcome-dashlet svg');
                break;
            case Constants.EPI_CURVE_TYPES.REPORTING.value:
                this.getEpiCurveDashlet('app-epi-curve-reporting-dashlet svg');
                break;
        }
    }

    /**
     * Get Epi curve dashlet
     */
    private getEpiCurveDashlet(selector: string) {
        this.domService
            .getPNGBase64(selector, '#tempCanvas')
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
                        this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_EPI_CURVE_REPORT_LABEL');
                    });
            });
    }

    /**
     * Generate KPIs report
     */
    generateKpisReport() {
        this.showLoadingDialog();
        (domtoimage as any).toPng(this.kpiSection.nativeElement)
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
     * Apply side filters
     * @param data
     */
    applySideFilters(filters: AppliedFilterModel[]) {
        // retrieve date & location filters
        // retrieve location filter
        const dateFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'date' } });
        const locationFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'locationId' } });
        const classificationFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'classificationId' } });

        // set filters
        this.globalFilterDate = _.isEmpty(dateFilter.value) ? undefined : moment(dateFilter.value);
        this.globalFilterLocationId = _.isEmpty(locationFilter.value) ? undefined : locationFilter.value;
        this.globalFilterClassificationId = _.isEmpty(classificationFilter.value) ? undefined : classificationFilter.value;
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

        // classification
        // since we display all classifications in the exported file, it would be strange to filter them by classification
        // so there is nothing to filter here
        // if (this.globalFilterClassificationId) {
        //     qb.filter.bySelect(
        //         'classification',
        //         this.globalFilterClassificationId,
        //         false,
        //         null
        //     );
        // }

        // finished
        return qb;
    }

    /**
     * Contacts follow up success rate
     */
    qbContactsFollowUpSuccessRate(): RequestQueryBuilder {
        // initialization
        const qb = new RequestQueryBuilder();

        // date filters
        if (this.globalFilterDate) {
            // pdf report
            qb.filter.flag(
                'dateOfFollowUp',
                this.globalFilterDate.startOf('day').format()
            );

            // same as list view
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

        // classification
        // there is no need to filter by classification since this api filters contacts and not cases...
        // if (this.globalFilterClassificationId) {
        //     qb.filter.bySelect(
        //         'classification',
        //         this.globalFilterClassificationId,
        //         false,
        //         null
        //     );
        // }

        // finished
        return qb;
    }

    /**
     * Check if we have kpi group access
     */
    hasKpiAccess(): boolean {
        // check if there is at least one group that has access
        for (const group of this.kpiGroups) {
            if (group.hasAccess(this.authUser)) {
                return true;
            }
        }

        // we don't have access
        return false;
    }
}
