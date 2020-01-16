import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { AbstractControl, NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import * as _ from 'lodash';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-upstream-server',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-upstream-server.component.html',
    styleUrls: ['./create-upstream-server.component.less']
})
export class CreateUpstreamServerComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumb header
    breadcrumbs: BreadcrumbItemModel[] = [];

    // check for duplicate urls
    duplicateUrls: { [ name: string ]: AbstractControl };

    upstreamServerData: SystemUpstreamServerModel = new SystemUpstreamServerModel();

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private systemSettingsDataService: SystemSettingsDataService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.duplicateUrls = _.transform(settings.upstreamServers, (result, upstreamServer: SystemUpstreamServerModel, index: number) => {
                    result[index + 'url'] = {
                        value: upstreamServer.url
                    } as any;
                }, {});
            });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (SystemUpstreamServerModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_TITLE', '/system-config/upstream-servers'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TITLE', '.', true));
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
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((settings: SystemSettingsModel) => {
                    // add the new upstream server
                    settings.upstreamServers.push(dirtyFields);

                    // save upstream servers
                    this.systemSettingsDataService
                        .modifySystemSettings({
                            upstreamServers: settings.upstreamServers
                        })
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_ACTION_CREATE_UPSTREAM_SERVER_SUCCESS_MESSAGE');

                            // hide dialog
                            loadingDialog.close();

                            // navigate to listing page
                            this.disableDirtyConfirm();
                            if (SystemUpstreamServerModel.canList(this.authUser)) {
                                this.router.navigate(['/system-config/upstream-servers']);
                            } else {
                                // fallback to current page since we already know that we have access to this page
                                this.redirectService.to([`/system-config/upstream-servers/create`]);
                            }
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
