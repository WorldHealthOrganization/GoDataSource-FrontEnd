import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthDataService } from '../data/auth.data.service';
import { ModulePath } from '../../enums/module-path.enum';

@Injectable()
export class PasswordChangeGuard implements CanActivate {

    constructor(
        private authDataService: AuthDataService,
        private router: Router
    ) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // get the authenticated user
        const user = this.authDataService.getAuthenticatedUser();

        // check if user is authenticated
        if (user) {
            // check if we need to change our password
            // if not we can continue to our page
            if (!user.passwordChange) {
                return true;
            }

            // we need to force user to change his password
            // account module ( change password & set security questions )
            if (next.routeConfig.path !== ModulePath.AccountModule) {
                this.router.navigate(['/account/change-password']);
                return false;
            }

            // we're allowed to be here - enjoy
            return true;
        }

        // finished
        return false;
    }

}
