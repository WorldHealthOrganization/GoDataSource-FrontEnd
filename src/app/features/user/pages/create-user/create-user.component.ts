import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NgForm } from '@angular/forms';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-user',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-user.component.html',
    styleUrls: ['./create-user.component.less']
})
export class CreateUserComponent extends ConfirmOnFormChanges implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    OutbreakModel = OutbreakModel;

    // authenticated user
    authUser: UserModel;

    newUser: UserModel = new UserModel();
    passwordConfirmModel: string;
    rolesList$: Observable<UserRoleModel[]>;
    outbreaksList$: Observable<OutbreakModel[]>;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();

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
        if (UserModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '/users'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_USER_TITLE', '.', true));
    }

    /**
     * Create new user
     */
    createNewUser(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // remove password confirm
        if (dirtyFields.passwordConfirm) {
            delete dirtyFields.passwordConfirm;
        }

        if (form.valid && !_.isEmpty(dirtyFields)) {
            // modify the user
            const loadingDialog = this.dialogService.showLoadingDialog();

            // try to authenticate the user
            this.userDataService
                .createUser(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newUser: UserModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    this.disableDirtyConfirm();
                    if (UserModel.canModify(this.authUser)) {
                        this.router.navigate([`/users/${newUser.id}/modify`]);
                    } else if (UserModel.canView(this.authUser)) {
                        this.router.navigate([`/users/${newUser.id}/view`]);
                    } else if (UserModel.canList(this.authUser)) {
                        this.router.navigate([`/users`]);
                    } else {
                        // fallback to current page since we already know that we have access to this page
                        this.redirectService.to([`/users/create`]);
                    }
                });
        }
    }
}
