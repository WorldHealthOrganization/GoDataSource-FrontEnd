import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
import { IPermissionChildModel, PermissionModel } from '../../../../core/models/permission.model';
import { DomSanitizer } from '@angular/platform-browser';
import { UserRoleHelper } from '../../../../core/helperClasses/user-role.helper';

@Component({
    selector: 'app-create-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-role.component.html',
    styleUrls: ['./create-role.component.less']
})
export class CreateRoleComponent extends ConfirmOnFormChanges {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_USER_ROLES_TITLE', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_USER_ROLE_TITLE', '.', true)
    ];

    // constants
    PermissionModel = PermissionModel;

    newUserRole: UserRoleModel = new UserRoleModel();
    availablePermissions$: Observable<any[]>;

    constructor(
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private sanitized: DomSanitizer,
        private i18nService: I18nService
    ) {
        super();
        // get the list of permissions to populate the dropdown in UI
        this.availablePermissions$ = this.userRoleDataService.getAvailablePermissions();
    }

    createNewRole(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {
            // modify the user
            const loadingDialog = this.dialogService.showLoadingDialog();

            // try to authenticate the user
            this.userRoleDataService
                .createRole(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newRole: UserRoleModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_USER_ROLE_ACTION_CREATE_USER_ROLE_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/user-roles/${newRole.id}/modify`]);
                });
        }
    }

    /**
     * Add required permissions to token
     */
    groupOptionFormatMethod(
        sanitized: DomSanitizer,
        i18nService: I18nService,
        groupsMap: ISelectGroupMap<PermissionModel>,
        optionsMap: ISelectGroupOptionMap<IPermissionChildModel>,
        option: IPermissionChildModel
    ): ISelectGroupOptionFormatResponse {
        return UserRoleHelper.groupOptionFormatMethod(
            sanitized,
            i18nService,
            groupsMap,
            optionsMap,
            option
        );
    }

    /**
     * Group checked other option ( all / none / partial )
     */
    groupSelectionChanged(data: IGroupEventData) {
        // #TODO
        console.log(data);
    }

    /**
     * Group child option check state changed
     */
    groupOptionCheckStateChanged(data: IGroupOptionEventData) {
        UserRoleHelper.groupOptionCheckStateChanged(
            data,
            this.sanitized,
            this.i18nService,
            this.dialogService
        );
    }
}
