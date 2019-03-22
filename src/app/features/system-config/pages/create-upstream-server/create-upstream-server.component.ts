import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { AbstractControl, NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import * as _ from 'lodash';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-create-upstream-server',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-upstream-server.component.html',
    styleUrls: ['./create-upstream-server.component.less']
})
export class CreateUpstreamServerComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_TITLE',
            '/system-config/upstream-servers'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TITLE',
            '.',
            true
        )
    ];

    // check for duplicate urls
    duplicateUrls: { [ name: string ]: AbstractControl };

    upstreamServerData: SystemUpstreamServerModel = new SystemUpstreamServerModel();

    constructor(
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private systemSettingsDataService: SystemSettingsDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    /**
     * On init
     */
    ngOnInit() {
        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.duplicateUrls = _.transform(settings.upstreamServers, (result, upstreamServer: SystemUpstreamServerModel, index: number) => {
                    result[index + 'url'] = {
                        value: upstreamServer.url
                    };
                }, {});
            });
    }

    /**
     * Create Upstream server
     * @param {NgForm[]} stepForms
     */
    createNewUpstreamServer(stepForms: NgForm[]) {
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
                    // add the new upstream server
                    settings.upstreamServers.push(dirtyFields);

                    // save upstream servers
                    this.systemSettingsDataService
                        .modifySystemSettings({
                            upstreamServers: settings.upstreamServers
                        })
                        .catch((err) => {
                            this.snackbarService.showApiError(err);
                            loadingDialog.close();
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_ACTION_CREATE_UPSTREAM_SERVER_SUCCESS_MESSAGE');

                            // hide dialog
                            loadingDialog.close();

                            // navigate to listing page
                            this.disableDirtyConfirm();
                            this.router.navigate(['/system-config/upstream-servers']);
                        });

                });
        }
    }

    /**
     * Make url in proper format
     * @param {string} url
     */
    formatUrl(url: string) {
        this.upstreamServerData.url = url.replace(/\s/g, '');
    }
}
