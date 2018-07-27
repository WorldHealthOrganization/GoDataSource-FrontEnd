import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '../helper/i18n.service';

@Injectable()
export class LanguageResolverService implements Resolve<any> {
    constructor(
       private translateService: TranslateService,
       private i18nService: I18nService
    ) {}

    /**
     * Language loaded, we can display the website pages
     */
    resolve(): Observable<any> {
        return Observable.create((observer: Subscriber<void>) => {
            if (this.translateService.currentLang) {
                observer.next();
                observer.complete();
            } else {
                this.i18nService.waitForLanguageInitialization().subscribe(() => {
                    observer.next();
                    observer.complete();
                });
            }
        });
    }
}
