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
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

@Component({
    selector: 'app-system-upstream-sync-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-client-applications.component.html',
    styleUrls: ['./system-client-applications.component.less']
})
export class SystemClientApplicationsComponent extends ListComponent implements OnInit {
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

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private systemSettingsDataService: SystemSettingsDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private outbreakDataService: OutbreakDataService
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
            }),
            new VisibleColumnModel({
                field: 'outbreaks',
                label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.clientApplicationsServerList = [];
        Observable.forkJoin([
            this.outbreakDataService.getOutbreaksList(),
            this.systemSettingsDataService.getSystemSettings()
        ]).catch((err) => {
            this.snackbarService.showError(err.message);
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
                                        this.snackbarService.showError(err.message);
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
                            this.snackbarService.showError(err.message);
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
}
