import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';

@Component({
    selector: 'app-authenticated',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './authenticated.component.html',
    styleUrls: ['./authenticated.component.less']
})
export class AuthenticatedComponent implements OnInit {

    // authenticated user
    authUser: UserModel;

    constructor(
        private router: Router,
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        // check if user is authenticated
        if (!this.authUser) {
            // user is NOT authenticated; redirect to Login page
            this.router.navigate(['/auth/login']);
        } else {
            // user is authenticated; redirect to default page (#TODO maybe Outbeaks page)
            this.router.navigate(['/users']);
        }
    }

}
