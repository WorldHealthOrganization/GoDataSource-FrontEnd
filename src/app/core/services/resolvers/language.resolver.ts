import { Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '../helper/i18n.service';
import { Observable, Subscriber } from 'rxjs';
import { DialogService } from '../helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { AuthDataService } from '../data/auth.data.service';

@Injectable()
export class LanguageResolver implements Resolve<any> {
    /**
     * Constructor
     */
    constructor(
        private translateService: TranslateService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private router: Router
    ) {}

    /**
     * Language loaded, we can display the website pages
     */
    resolve(): Observable<any> {
        return new Observable((observer: Subscriber<void>) => {
            if (this.translateService.currentLang) {
                observer.next();
                observer.complete();
            } else {
                // display loading
                const loadingDialog = this.dialogService.showLoadingDialog();

                // load language
                this.i18nService.waitForLanguageInitialization()
                    .pipe(
                        catchError((err) => {
                            // determine if this is a token validation error or something else has gone bad
                            if (
                                err &&
                                err.statusCode === 401
                            ) {
                                // remove cache
                                this.authDataService.clearStorage();
                                this.i18nService.clearStorage();

                                // load the default language
                                this.i18nService
                                    .loadUserLanguage()
                                    .pipe(
                                        catchError((childErr) => {
                                            // hide loading
                                            loadingDialog.close();

                                            // display error message
                                            alert('Error retrieving languages ( api might be down - please try a hard refresh )');

                                            // finished
                                            return throwError(childErr);
                                        })
                                    )
                                    .subscribe(() => {
                                        // hide loading
                                        loadingDialog.close();

                                        // redirect to Login page
                                        this.router.navigate(['/auth/login']);
                                    });

                                // finished
                                return throwError(err);
                            }

                            // hide loading
                            loadingDialog.close();

                            // display error message
                            alert('Error retrieving languages ( api might be down - please try a hard refresh )');

                            // finished
                            return throwError(err);
                        })
                    )
                    .subscribe(() => {
                        // hide loading
                        loadingDialog.close();

                        // this callback is called 99% of the time only when we refresh a page
                        // refresh user permissions ?
                        const authUser = this.authDataService.getAuthenticatedUser();
                        if (!authUser) {
                            // finished
                            observer.next();
                            observer.complete();
                        } else {
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe(() => {
                                    // finished
                                    observer.next();
                                    observer.complete();
                                });
                        }
                    });
            }
        });
    }
}
