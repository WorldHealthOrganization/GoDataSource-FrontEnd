import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { OutbreakTemplateModel } from '../../../models/outbreak-template.model';
import { OutbreakTemplateDataService } from '../../data/outbreak-template.data.service';

@Injectable()
export class OutbreakTemplateDataResolver implements Resolve<OutbreakTemplateModel> {
  /**
   * Constructor
   */
  constructor(
    private toastV2Service: ToastV2Service,
    private outbreakTemplateDataService: OutbreakTemplateDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<OutbreakTemplateModel> {
    // not found
    let request: Observable<OutbreakTemplateModel> = of(null);

    // contact ?
    if (route.queryParams.outbreakTemplateId) {
      request = this.outbreakTemplateDataService.getOutbreakTemplate(route.queryParams.outbreakTemplateId);
    }

    // retrieve
    return request
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
