import { Component, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-login',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less']
})
export class LoginComponent {

    user = {
        email: '',
        password: '',
        passwordConfirm: ''
    };

    constructor(
        private authDataService: AuthDataService
    ) {
    }

    login() {
        this.authDataService
            .login(this.user)
            .subscribe();
    }

}
