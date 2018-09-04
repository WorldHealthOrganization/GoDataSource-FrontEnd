import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { AuthDataService } from '../data/auth.data.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private authDataService: AuthDataService,
        private router: Router
    ) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // get the authenticated user
        const user = this.authDataService.getAuthenticatedUser();

        // check if user is authenticated
        if (user) {
            // check if there are any permissions defined on route
            const routePermissions = _.get(next, 'data.permissions', []);

            // check if user has the required permissions
            return user.hasPermissions(...routePermissions);
        }

        // not logged in so redirect to login page
        this.router.navigate(['/auth/login']);

        return false;
    }

}
