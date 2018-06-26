import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { RouterHelperService } from '../../../../core/services/helper/router-helper.service';
import { ModelHelperService } from '../../../../core/services/helper/model-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SecurityQuestionModel } from "../../../../core/models/securityQuestion.model";
import { Router } from "@angular/router";

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
    securityQuestionsList$: any[];
    alreadySet: boolean = true;
    viewForm: boolean = false;

    constructor(
        private routerHelper: RouterHelperService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private modelHelperService: ModelHelperService,
        private router: Router,
        private authDataService: AuthDataService
    ) {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.securityQuestionsList$ = [];
        this.userDataService.getSecurityQuestionsList().subscribe((questionsList) => {
            for (let securityQuestion of questionsList){
                this.securityQuestionsList$.push({label: securityQuestion, value: securityQuestion});
            }
        });
        if(!this.authUser.securityQuestions){
            this.alreadySet = false;
            this.viewForm = true;
            this.authUser.securityQuestions = [];
            this.authUser.securityQuestions.push(new SecurityQuestionModel());
            this.authUser.securityQuestions.push(new SecurityQuestionModel());
        }
    }

    save(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any[] = form.value;
            // check the questions to be different
            if(this.authUser.securityQuestions[0].question == this.authUser.securityQuestions[1].question)
            {
                alert("Please select 2 different questions!");
            } else {
                let userId = this.authUser.id;
                let userSecurityQuestionsData = { securityQuestions: this.authUser.securityQuestions };

                this.userDataService
                    .modifyUser(userId, userSecurityQuestionsData)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);
                        return ErrorObservable.create(err);
                    })
                    .subscribe(response => {
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
    }

    allowEdit(){
        this.viewForm = true;
    }

}
