import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { MatSidenav } from '@angular/material';

@Component({
    selector: 'app-authenticated',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './authenticated.component.html',
    styleUrls: ['./authenticated.component.less']
})
export class AuthenticatedComponent implements OnInit {

    @ViewChild('snav') sideNav: MatSidenav;

    // authenticated user
    authUser: UserModel;

    constructor(
        private router: Router,
        private authDataService: AuthDataService
    ) {
        // detect when the route is changed
        this.router.events.subscribe(() => {
            // close the SideNav whenever the route is changed
            if (this.sideNav) {
                this.sideNav.close();
            }
        });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        // check if user is authenticated
        if (!this.authUser) {
            // user is NOT authenticated; redirect to Login page
            return this.router.navigate(['/auth/login']);
        }

        if (this.router.url === '/') {
            // redirect to default landing page
            return this.router.navigate(['/users']);
        }
    }

}
