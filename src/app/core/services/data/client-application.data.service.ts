import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { IBasicCount } from '../../models/basic-count.interface';
import { SystemClientApplicationModel } from '../../models/system-client-application.model';

@Injectable()
export class ClientApplicationDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list of client applications
   */
  getClientApplicationsList(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<SystemClientApplicationModel[]> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`client-applications?filter=${filter}`),
      SystemClientApplicationModel
    );
  }

  /**
   * Return total number of client applications
   */
  getClientApplicationsCount(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`client-applications/count?where=${whereFilter}`);
  }

  /**
   * Retrieve a client application
   */
  getClientApplication(clientApplicationId: string): Observable<SystemClientApplicationModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`client-applications/${clientApplicationId}`),
      SystemClientApplicationModel
    );
  }

  /**
   * Add a new client application
   */
  createClientApplication(clientApplicationData): Observable<any> {
    return this.http.post('client-applications', clientApplicationData);
  }

  /**
   * Modify an existing client application
   */
  modifyClientApplication(
    clientApplicationId: string,
    clientApplicationData
  ): Observable<SystemClientApplicationModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`client-applications/${clientApplicationId}`, clientApplicationData),
      SystemClientApplicationModel
    );
  }

  /**
   * Delete an existing client application
   */
  deleteClientApplication(clientApplicationId: string): Observable<any> {
    return this.http.delete(`client-applications/${clientApplicationId}`);
  }
}

