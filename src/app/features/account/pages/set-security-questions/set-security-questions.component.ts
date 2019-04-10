import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SecurityQuestionModel } from '../../../../core/models/securityQuestion.model';
import { Observable } from 'rxjs';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { catchError, share } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-set-security-questions',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './set-security-questions.component.html',
    styleUrls: ['./set-security-questions.component.less']
})
export class SetSecurityQuestionsComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_SET_SECURITY_QUESTIONS_TITLE', '.', true)
    ];

    authUser: UserModel;
    securityQuestionsList$: Observable<SecurityQuestionModel[]>;
    answers: any = [];

    // flag to display the form for changing the security questions
    viewForm: boolean = false;

    constructor(
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService
    ) {
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.securityQuestionsList$ = this.userDataService.getSecurityQuestionsList().pipe(share());

        // check if user has security questions set
        if (
            _.isEmpty(this.authUser.securityQuestions[0].question) ||
            _.isEmpty(this.authUser.securityQuestions[1].question)
        ) {
            // security questions are not set; show form
            this.viewForm = true;
        } else {
            // security questions are set; show details
            this.viewForm = false;
        }
    }

    save(form: NgForm) {
        if (form.valid) {
            const fields: any = this.formHelper.getFields(form);

            this.userDataService
                .modifyUser(this.authUser.id, fields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        return throwError(err);
                    })
                )
                .subscribe(() => {
                    this.authDataService
                        .reloadAndPersistAuthUser()
                        .subscribe((authenticatedUser) => {
                            this.authUser = authenticatedUser.user;
                            this.snackbarService.showSuccess('LNG_PAGE_SET_SECURITY_QUESTIONS_ACTION_SAVE_SUCCESS_MESSAGE');
                            this.viewForm = false;
                        });
                });
        }
    }

    allowEdit() {
        this.viewForm = true;
    }

}
