import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { DialogAnswer, DialogAnswerButton, DialogField, DialogFieldType, LoadingDialogModel } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable ,  Subscriber } from 'rxjs';

import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-client-applications-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './client-applications-list.component.html',
    styleUrls: ['./client-applications-list.component.less']
})
export class ClientApplicationsListComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // client applications servers
    clientApplicationsServerList: SystemClientApplicationModel[] = [];

    // settings
    settings: SystemSettingsModel;

    // constants
    UserSettings = UserSettings;

    loadingDialog: LoadingDialogModel;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private systemSettingsDataService: SystemSettingsDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private outbreakDataService: OutbreakDataService,
        private i18nService: I18nService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // retrieve backups
        this.needsRefreshList(true);
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'credentials',
                label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CREDENTIALS'
            }),
            new VisibleColumnModel({
                field: 'active',
                label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ACTIVE'
            })
        ];

        // outbreaks
        if (this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK)) {
            this.tableColumns.push(
                new VisibleColumnModel({
                    field: 'outbreaks',
                    label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS'
                })
            );
        }

        // actions
        this.tableColumns.push(
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        );
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.clientApplicationsServerList = [];
        Observable.forkJoin([
            this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK) ?
                this.outbreakDataService.getOutbreaksList() :
                Observable.of([]),
            this.systemSettingsDataService.getSystemSettings()
        ]).catch((err) => {
            this.snackbarService.showApiError(err);
            return ErrorObservable.create(err);
        }).subscribe(([outbreaksList, systemSettings]: [OutbreakModel[], SystemSettingsModel]) => {
            // map outbreaks
            const mappedOutbreaks: {
                [outbreakID: string]: OutbreakModel
            } = _.groupBy(outbreaksList, 'id');

            // get settings
            this.settings = systemSettings;
            this.clientApplicationsServerList = _.map(
                _.get(this.settings, 'clientApplications', []),
                (item: SystemClientApplicationModel) => {
                    // set outbreak
                    item.outbreaks = _.transform(
                        item.outbreakIDs,
                        (result, outbreakID: string) => {
                            // outbreak not deleted ?
                            if (!_.isEmpty(mappedOutbreaks[outbreakID])) {
                                result.push(mappedOutbreaks[outbreakID][0]);
                            }
                        },
                        []
                    );

                    // finished
                    return item;
                });

            // flag if list is empty
            this.checkEmptyList(this.clientApplicationsServerList);
        });
    }

    /**
     * Check if we have write access to sys settings
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Delete record
     * @param item
     */
    deleteClientApplication(clientApplication: SystemClientApplicationModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CLIENT_APPLICATION', clientApplication)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.systemSettingsDataService
                        .getSystemSettings()
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe((settings: SystemSettingsModel) => {
                            // remove client application
                            const cleanClientApplication: SystemClientApplicationModel = _.cloneDeep(clientApplication);
                            delete cleanClientApplication.outbreaks;
                            const upIndex: number = _.findIndex(settings.clientApplications, cleanClientApplication);
                            if (upIndex > -1) {
                                // remove server
                                settings.clientApplications.splice(upIndex, 1);

                                // save upstream servers
                                this.systemSettingsDataService
                                    .modifySystemSettings({
                                        clientApplications: settings.clientApplications
                                    })
                                    .catch((err) => {
                                        this.snackbarService.showApiError(err);
                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe(() => {
                                        // display success message
                                        this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                                        // refresh
                                        this.needsRefreshList(true);
                                    });
                            } else {
                                // not found ?
                                // IGNORE...
                                this.needsRefreshList(true);
                            }
                        });
                }
            });
    }

    /**
     * Toggle active flag
     * @param upstreamServer
     */
    toggleActiveFlag(clientApplication: SystemClientApplicationModel) {
        // save
        this.systemSettingsDataService
            .getSystemSettings()
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((settings: SystemSettingsModel) => {
                // client application
                const cleanClientApplication: SystemClientApplicationModel = _.cloneDeep(clientApplication);
                delete cleanClientApplication.outbreaks;
                const clientApplicationItem: SystemClientApplicationModel = _.find(settings.clientApplications, cleanClientApplication);
                if (clientApplicationItem) {
                    // set flag
                    clientApplication.active = !clientApplication.active;
                    clientApplicationItem.active = clientApplication.active;

                    // save client applications
                    this.systemSettingsDataService
                        .modifySystemSettings({
                            clientApplications: settings.clientApplications
                        })
                        .catch((err) => {
                            this.snackbarService.showApiError(err);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_TOGGLE_ENABLED_SUCCESS_MESSAGE');
                        });
                } else {
                    // not found ?
                    // IGNORE...
                    this.needsRefreshList(true);
                }
            });
    }

    /**
     * Download Configuration File
     * @param clientApplication
     */
    downloadConfFile(clientApplication: SystemClientApplicationModel) {
        // construct api url if necessary
        let apiUrl: string = environment.apiUrl;
        apiUrl = apiUrl.indexOf('http://') === 0 || apiUrl.indexOf('https://') === 0 ?
            apiUrl : (
                ( apiUrl.indexOf('/') === 0 ? '' : '/') +
                window.location.origin +
                apiUrl
            );

        // define api async check
        let apiURL: string;
        const apiObserver = new Observable((subscriber: Subscriber<boolean>) => {
            if (
                _.isString(apiURL) &&
                apiURL.includes('localhost')
            ) {
                subscriber.next(false);
                subscriber.complete();
            } else {
                this.systemSettingsDataService
                    .getAPIVersion(apiURL)
                    .catch(() => {
                        subscriber.next(false);
                        subscriber.complete();
                        return [];
                    })
                    .subscribe((versionData) => {
                        if (_.get(versionData, 'version')) {
                            subscriber.next(true);
                            subscriber.complete();
                        } else {
                            subscriber.next(false);
                            subscriber.complete();
                        }
                    });
            }
        });

        // display export dialog
        this.dialogService.showExportDialog({
            message: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_TITLE',
            url: 'system-settings/generate-file',
            fileName: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_FILE_NAME') +
                ' - ' +
                moment().format('YYYY-MM-DD'),
            fileType: ExportDataExtension.QR,
            allowedExportTypesKey: 'type',
            extraAPIData: {
                data: {
                    clientId: clientApplication.credentials.clientId,
                    clientSecret: clientApplication.credentials.clientSecret
                }
            },
            isPOST: true,
            extraDialogFields: [
                new DialogField({
                    name: 'data[url]',
                    placeholder: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_URL_LABEL',
                    required: true,
                    value: apiUrl,
                    fieldType: DialogFieldType.URL,
                    urlAsyncErrorMsg: 'LNG_FORM_VALIDATION_ERROR_FIELD_URL',
                    urlAsyncValidator: (url: string): Observable<boolean> => {
                        apiURL = url;
                        return apiObserver;
                    }
                })
            ],
            fileExtension: 'png',
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
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
}
