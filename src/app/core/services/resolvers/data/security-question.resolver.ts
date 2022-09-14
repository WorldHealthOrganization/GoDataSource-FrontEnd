import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { UserDataService } from '../../data/user.data.service';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { SecurityQuestionModel } from '../../../models/securityQuestion.model';

@Injectable()
export class SecurityQuestionDataResolver implements IMapResolverV2<SecurityQuestionModel> {
  /**
   * Constructor
   */
  constructor(
    private userDataService: UserDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<SecurityQuestionModel>> {
    // construct query
    const qb = new RequestQueryBuilder();
    qb.fields('question');

    // sort them
    qb.sort
      .by('question', RequestSortDirection.ASC);

    // retrieve users
    return this.userDataService
      .getSecurityQuestionsList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<SecurityQuestionModel> = {
            list: data,
            map: {},
            options: []
          };
          data.forEach((item) => {
            // map
            response.map[item.question] = item;

            // add option
            response.options.push({
              label: item.question,
              value: item.question,
              data: item
            });
          });

          // finished
          return response;
        }),

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
