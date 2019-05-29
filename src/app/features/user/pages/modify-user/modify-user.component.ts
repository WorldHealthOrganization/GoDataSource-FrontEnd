import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NgForm } from '@angular/forms';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-modify-user',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-user.component.html',
    styleUrls: ['./modify-user.component.less']
})
export class ModifyUserComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    userId: string;
    user: UserModel = new UserModel();
    passwordConfirmModel: string;
    rolesList$: Observable<UserRoleModel[]>;
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the route params
        this.route.params.subscribe((params: {userId}) => {
            // get the ID of the User being modified
            this.userId = params.userId;

            // retrieve the User instance
            this.userDataService
                .getUser(this.userId)
                .subscribe((user: UserModel) => {
                    this.user = user;

                    // update breadcrumbs
                    this.createBreadcrumbs();
                });
        });

        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();
    }

    modifyUser(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // remove password confirm
        if (dirtyFields.passwordConfirm) {
            delete dirtyFields.passwordConfirm;
        }

        // remove password if empty
        if (_.isEmpty(dirtyFields.password)) {
            delete dirtyFields.password;
        }

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // modify the user
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.userDataService
                .modifyUser(this.userId, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((modifiedUser: UserModel) => {
                    // update model
                    this.user = modifiedUser;
                    // reset password confirm model
                    this.passwordConfirmModel = undefined;

                    // reload user auth data in case he's changing the active outbreak
                    this.authDataService
                        .reloadAndPersistAuthUser()
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // mark form as pristine
                            form.form.markAsPristine();

                            // display message
                            this.snackbarService.showSuccess('LNG_PAGE_MODIFY_USER_ACTION_MODIFY_USER_SUCCESS_MESSAGE');

                            // update breadcrumbs
                            this.createBreadcrumbs();

                            // hide dialog
                            loadingDialog.close();
                        });
                });
        }
    }

    /**
     * Check if the user has read access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK);
    }
    /**
     * Check if we have write access to users
     * @returns {boolean}
     */
    hasUserWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_USER_ACCOUNT);
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '/users'),
            new BreadcrumbItemModel(
                this.user.name,
                null,
                true
            )
        );
    }
}
