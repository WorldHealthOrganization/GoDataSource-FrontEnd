import { Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { I18nService } from '../helper/i18n.service';
import { Observable, Subscriber } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { AuthDataService } from '../data/auth.data.service';
import { DialogV2Service } from '../helper/dialog-v2.service';

@Injectable()
export class LanguageUserResolver
implements Resolve<any> {

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService,
    private router: Router
  ) {}

  /**
   * Language loaded, we can display the website pages
   */
  resolve(): Observable<any> {
    return new Observable((observer: Subscriber<void>) => {
      if (this.i18nService.currentLang) {
        observer.next();
        observer.complete();
      } else {
        // display loading
        const globalLoadingKey: string = 'language';
        this.dialogV2Service.showGlobalLoadingDialog(globalLoadingKey);

        // load language - need to initialize like this because otherwise in some situations languageSubscriber variable isn't found when token expired
        const languageSubscriber = this.i18nService.waitForLanguageInitialization()
          .pipe(
            catchError((err) => {
              // unsubscribe - hack for observable that isn't a subject..it  still being called
              try {
                if (
                  languageSubscriber &&
                  !languageSubscriber.closed
                ) {
                  languageSubscriber.unsubscribe();
                }
              } catch (e) {}

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
                      this.dialogV2Service.hideGlobalLoadingDialog(globalLoadingKey);

                      // display error message
                      alert('Error retrieving languages ( api might be down - please try a hard refresh )');

                      // finished
                      return throwError(childErr);
                    })
                  )
                  .subscribe(() => {
                    // hide loading
                    this.dialogV2Service.hideGlobalLoadingDialog(globalLoadingKey);

                    // redirect to Login page
                    this.router.navigate(['/auth/login']);
                  });

                // finished
                return throwError(err);
              }

              // hide loading
              this.dialogV2Service.hideGlobalLoadingDialog(globalLoadingKey);

              // display error message
              alert('Error retrieving languages ( api might be down - please try a hard refresh )');

              // finished
              return throwError(err);
            })
          )
          .subscribe(() => {
            // unsubscribe - hack for observable that isn't a subject..it  still being called
            if (
              languageSubscriber &&
              !languageSubscriber.closed
            ) {
              languageSubscriber.unsubscribe();
            }

            // hide loading
            this.dialogV2Service.hideGlobalLoadingDialog(globalLoadingKey);

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
