import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';

import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { RouterHelperService } from '../../../../core/services/helper/router-helper.service';
import { ModelHelperService } from '../../../../core/services/helper/model-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SecurityQuestionModel } from '../../../../core/models/securityQuestion.model';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

@Component({
    selector: 'app-set-security-questions',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './set-security-questions.component.html',
    styleUrls: ['./set-security-questions.component.less']
})
export class SetSecurityQuestionsComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Set Security Questions', '.', true)
    ];

    authUser: UserModel;
    securityQuestionsList$: Observable<SecurityQuestionModel[]>;
    answers: any = [];
    alreadySet: boolean = true;
    viewForm: boolean = false;

    constructor(
        private routerHelper: RouterHelperService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private modelHelperService: ModelHelperService,
        private router: Router,
        private authDataService: AuthDataService
    ) {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.securityQuestionsList$ = this.userDataService.getSecurityQuestionsList().share();
        if (_.isEmpty(this.authUser.securityQuestions[0].question) || _.isEmpty(this.authUser.securityQuestions[1].question)) {
            this.alreadySet = false;
            this.viewForm = true;
        }
    }

    save(form: NgForm) {
        if (form.valid) {
            const fields: any = this.formHelper.getFields(form);

            this.userDataService
                .modifyUser(this.authUser.id, fields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.authDataService
                        .reloadAndPersistAuthUser()
                        .subscribe((authenticatedUser) => {
                            this.authUser = authenticatedUser.user;
                            this.snackbarService.showSuccess('Security Questions were updated!');
                            this.viewForm = false;
                            this.alreadySet = true;
                        });
                });
        }
    }

    allowEdit() {
        this.viewForm = true;
    }

}
