import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

import * as _ from 'lodash';
import { Observable } from "rxjs/Observable";
import { SecurityQuestionModel } from "../../../../core/models/securityQuestion.model";

@Component({
    selector: 'app-reset-password-questions',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reset-password-questions.component.html',
    styleUrls: ['./reset-password-questions.component.less']
})
export class ResetPasswordQuestionsComponent{

    dataModel = {
        email: null,
        questions: [{question: null, answer: null}, {question: null, answer: null}]
   };
    securityQuestionsList$: Observable<SecurityQuestionModel[]>;


    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        this.securityQuestionsList$ = this.userDataService.getSecurityQuestionsList();
    }


    resetPassword(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // send request to get token
            this.userDataService
                .resetPasswordQuestions(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe((result) => {
                    // send the user to reset password page
                    this.router.navigate(['/auth/reset-password'], { queryParams: { token: result.token } });
                 });


        }
    }

}
