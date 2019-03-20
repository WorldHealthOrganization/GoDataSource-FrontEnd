import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { Observable } from 'rxjs/Observable';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { map } from 'rxjs/operators';
import * as moment from 'moment';

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
        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.include(`locations`, true);
        qb.include(`dateRangeLocations`, true);
        qb.merge(queryBuilder);
        const filter = qb.buildQuery();

        const graphData$ = this.http.get(`outbreaks/${outbreakId}/cases/bars-transmission-chains?filter=${filter}`)
            .pipe(map((graphData: any) => {
                // #TODO remove this when API is fixed
                graphData.casesMap = graphData.cases;

                graphData.caseIds = Object.values(graphData.casesMap);
                graphData.caseIds.sort((a, b) => moment(a.dateOfOnset).isBefore(moment(b.dateOfOnset)) ? -1 : 1);
                graphData.caseIds = graphData.caseIds.map((caseData) => caseData.id);

                return graphData;
            }));

        return graphData$ as Observable<TransmissionChainBarsModel>;
    }
}
