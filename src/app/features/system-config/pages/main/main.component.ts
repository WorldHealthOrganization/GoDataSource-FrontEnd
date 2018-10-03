import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs/Observable';
import { BackupModel } from '../../../../core/models/backup.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-system-config-main',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.less']
})
export class MainComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_MAIN_SYSTEM_CONFIG_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // settings
    settings: SystemSettingsModel;

    // backups list
    backupsList$: Observable<BackupModel[]>;

    // module list
    moduleList: LabelValuePair[];

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private dialogService: DialogService,
        private systemSettingsDataService: SystemSettingsDataService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService
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

        // default backup settings
        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.settings = settings;
            });

        this.genericDataService
            .getBackupModuleList()
            .subscribe((moduleList) => {
                this.moduleList = moduleList;
            });

        // retrieve backups
        this.needsRefreshList();
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.backupsList$ = this.systemSettingsDataService.getBackupList();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'location',
            // 'modules',
            // 'data',
            // 'status',
            // 'error',
            // 'actions'
        ];
    }

    /**
     * Backup data
     */
    backupData() {
        // display dialog
        this.dialogService.showInput(new DialogConfiguration({
            message: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_TITLE',
            yesLabel: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_BACKUP_BUTTON',
            fieldsList: [
                new DialogField({
                    name: 'modules',
                    placeholder: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_MODULES',
                    inputOptions: this.moduleList,
                    inputOptionsMultiple: true,
                    required: true,
                    value: this.settings.dataBackup.modules
                })
            ]
        })).subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                this.systemSettingsDataService
                    .createBackup(answer.inputValue.value)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);
                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        // display success message
                        this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

                        // refresh page
                        this.needsRefreshList(true);
                    });
            }
        });
    }
}
