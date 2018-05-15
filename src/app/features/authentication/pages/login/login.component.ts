import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { LoginModel } from '../../../../core/models/login.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {

    user = new LoginModel();

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService
    ) {
    }

    ngOnInit() {
        // check if user is authenticated
        if (this.authDataService.isAuthenticated()) {
            // user is already authenticated; redirect to dashboard home page
            this.router.navigate(['']);
        }
    }

    login() {
        this.authDataService
            .login(this.user)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('Welcome !');

                // successfully authenticated; redirect to dashboard home page
                this.router.navigate(['']);
            });
    }

}
