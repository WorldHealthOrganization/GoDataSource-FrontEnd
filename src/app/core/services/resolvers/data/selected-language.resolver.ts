import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { LanguageModel } from '../../../models/language.model';
import { LanguageDataService } from '../../data/language.data.service';

@Injectable()
export class SelectedLanguageDataResolver implements Resolve<LanguageModel> {
  /**
   * Constructor
   */
  constructor(
    private languageDataService: LanguageDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<LanguageModel> {
    // retrieve
    return this.languageDataService
      .getLanguage(
        route.params.languageId
      )
      .pipe(
        // should be last one
        catchError((err) => {
          // display error
          this.toastV2Service.error(err);

          // send error further
          return throwError(err);
        })
      );
  }
}
