import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '../helper/i18n.service';
import { Observable, Subscriber } from 'rxjs';
import { DialogService } from '../helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';

@Injectable()
export class LanguageResolver implements Resolve<any> {
    constructor(
        private translateService: TranslateService,
        private i18nService: I18nService,
        private dialogService: DialogService
    ) {
    }

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
                            // hide loading
                            loadingDialog.close();

                            // display error message
                            alert('Error retrieving languages ( api might be down )');

                            // finished
                            return throwError(err);
                        })
                    )
                    .subscribe(() => {
                        // hide loading
                        loadingDialog.close();

                        // finished
                        observer.next();
                        observer.complete();
                    });
            }
        });
    }
}
