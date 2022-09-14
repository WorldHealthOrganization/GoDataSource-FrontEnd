import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { HelpDataService } from '../../data/help.data.service';
import { HelpCategoryModel } from '../../../models/help-category.model';

@Injectable()
export class SelectedHelpCategoryDataResolver implements Resolve<HelpCategoryModel> {
  /**
   * Constructor
   */
  constructor(
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<HelpCategoryModel> {
    return this.helpDataService
      .getHelpCategory(
        route.params.categoryId
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
