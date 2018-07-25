import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { TransmissionChainModel } from '../../models/transmission-chain.model';

@Injectable()
export class TransmissionChainDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    /**
     * Retrieve the list of Transmission Chains
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getTransmissionChainsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`
        )
            .map((result) => {
                const nodes = _.get(result, 'nodes', {});
                const edges = _.get(result, 'edges', {});
                const transmissionChains = _.get(result, 'transmissionChains.chains', []);

                return _.map(transmissionChains, (chain) => {
                    return new TransmissionChainModel(chain, nodes, Object.values(edges));
                });
            });
    }
}

