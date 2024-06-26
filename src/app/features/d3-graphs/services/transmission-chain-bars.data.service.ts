import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { Observable } from 'rxjs';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';

@Injectable()
export class TransmissionChainBarsDataService {
  constructor(
    private http: HttpClient
  ) {}

  /**
     * Retrieve the list of Cases to build up the transmission chain
     */
  getTransmissionChainBarsData(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<TransmissionChainBarsModel> {
    const filter = queryBuilder.buildQuery();

    return this.http.get(`outbreaks/${outbreakId}/cases/bars-transmission-chains?filter=${filter}`) as Observable<TransmissionChainBarsModel>;
  }
}
