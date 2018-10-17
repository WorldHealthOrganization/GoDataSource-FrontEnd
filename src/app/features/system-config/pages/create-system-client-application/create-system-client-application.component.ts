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
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';

@Component({
    selector: 'app-create-system-upstream-sync',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-system-client-application.component.html',
    styleUrls: ['./create-system-client-application.component.less']
})
export class CreateSystemClientApplicationComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE',
            '/system-config/system-client-applications'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_CREATE_CLIENT_APPLICATION_TITLE',
            '.',
            true
        )
    ];

    clientApplicationData: SystemClientApplicationModel = new SystemClientApplicationModel();

    outbreaksOptionsList$: Observable<OutbreakModel[]>;

    constructor(
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private systemSettingsDataService: SystemSettingsDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // retrieve outbreaks
        this.outbreaksOptionsList$ = this.outbreakDataService.getOutbreaksList();
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
            this.systemSettingsDataService
                .getSystemSettings()
                .catch((err) => {
                    this.snackbarService.showError(err.message);
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
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_CLIENT_APPLICATION_ACTION_CREATE_CLIENT_APPLICATION_SUCCESS_MESSAGE');

                            // navigate to listing page
                            this.disableDirtyConfirm();
                            this.router.navigate(['/system-config/system-client-applications']);
                        });

                });
        }
    }
}
