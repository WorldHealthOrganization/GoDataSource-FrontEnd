import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { AuthDataService } from '../data/auth.data.service';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { SnackbarService } from '../helper/snackbar.service';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '../helper/i18n.service';

@Injectable()
export class AuthGuard implements CanActivate {
    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private translateService: TranslateService,
        private i18nService: I18nService
    ) {}

    /**
     * Can activate
     */
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | boolean {
        // get the authenticated user
        const user = this.authDataService.getAuthenticatedUser();

        // check if user is authenticated
        if (user) {
            // check if there are any permissions defined on route
            const routePermissions = _.get(next, 'data.permissions', []);

            // check if user has the required permissions
            if (_.isArray(routePermissions)) {
                if (user.hasPermissions(...routePermissions)) {
                    return true;
                }
            } else {
                if (user.hasPermissions(...[routePermissions])) {
                    return true;
                }
            }
        }

        // display not authorized error
        if (this.translateService.currentLang) {
            this.snackbarService.showError('LNG_ROLE_AVAILABLE_PERMISSIONS_NOT_AUTHORIZED_MESSAGE');
        } else {
            // load language
            const languageSubscriber = this.i18nService
                .waitForLanguageInitialization()
                .subscribe(() => {
                    this.snackbarService.showError('LNG_ROLE_AVAILABLE_PERMISSIONS_NOT_AUTHORIZED_MESSAGE');
                    if (
                        languageSubscriber &&
                        !languageSubscriber.closed
                    ) {
                        languageSubscriber.unsubscribe();
                    }
                });
        }

        // not logged in so redirect to login page
        if (!user) {
            this.router.navigate(['/auth/login']);
            return false;
        } else {
            // sign out in case we're signed in
            return new Observable<boolean>((observer) => {
                this.authDataService
                    .logout()
                    .pipe(
                        catchError(() => {
                            this.router.navigate(['/auth/login']);
                            observer.next(false);
                            return of(false);
                        })
                    )
                    .subscribe(() => {
                        this.router.navigate(['/auth/login']);
                        observer.next(false);
                    });
            });
        }
    }

}
