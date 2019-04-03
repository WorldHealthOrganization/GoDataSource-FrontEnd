import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import * as _ from 'lodash';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';

@Component({
    selector: 'app-create-client-application',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-client-application.component.html',
    styleUrls: ['./create-client-application.component.less']
})
export class CreateClientApplicationComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE',
            '/system-config/client-applications'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TITLE',
            '.',
            true
        )
    ];

    clientApplicationData: SystemClientApplicationModel = new SystemClientApplicationModel();

    outbreaksOptionsList$: Observable<OutbreakModel[]>;

    // authenticated user
    authUser: UserModel;

    constructor(
        private authDataService: AuthDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private systemSettingsDataService: SystemSettingsDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve outbreaks
        if (this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK)) {
            this.outbreaksOptionsList$ = this.outbreakDataService.getOutbreaksList();
        }
    }

    /**
     * Create Application Client
     * @param {NgForm[]} stepForms
     */
    createNewApplicationClient(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // create record
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.systemSettingsDataService
                .getSystemSettings()
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
                .subscribe((settings: SystemSettingsModel) => {
                    // add the new client application
                    settings.clientApplications.push(dirtyFields);

                    // save client applications
                    this.systemSettingsDataService
                        .modifySystemSettings({
                            clientApplications: settings.clientApplications
                        })
                        .catch((err) => {
                            this.snackbarService.showApiError(err);
                            loadingDialog.close();
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_ACTION_CREATE_CLIENT_APPLICATION_SUCCESS_MESSAGE');

                            // hide dialog
                            loadingDialog.close();

                            // navigate to listing page
                            this.disableDirtyConfirm();
                            this.router.navigate(['/system-config/client-applications']);
                        });

                });
        }
    }

    hasOutbreakReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK);
    }

    /**
     * Generate Random Key
     * @param property
     */
    generateKey(property: string) {
        // replace with generated value
        const generateRandom = () => {
            // generate string
            _.set(
                this.clientApplicationData,
                property,
                Constants.randomString(Constants.DEFAULT_RANDOM_KEY_LENGTH)
            );
        };

        // ask if we should replace existing value with a new value
        const propertyValue: string = _.get(this.clientApplicationData, property);
        if (_.isEmpty(propertyValue)) {
            generateRandom();
        } else {
            // show confirm dialog to confirm the action
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REPLACE_VALUE_WITH_NEW_ONE')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        generateRandom();
                    }
                });
        }
    }
}
