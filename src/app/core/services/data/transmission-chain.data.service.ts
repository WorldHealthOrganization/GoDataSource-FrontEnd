import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { TransmissionChainModel } from '../../models/transmission-chain.model';
import { MetricCasesWithContactsModel } from '../../models/metrics/metric-cases-contacts.model';
import { MetricIndependentTransmissionChainsModel } from '../../models/metrics/metric-independent-transmission-chains.model';
import { ModelHelperService } from '../helper/model-helper.service';

@Injectable()
export class TransmissionChainDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
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

    /**
     * Get length of independent transmission chains
     * @param {string} outbreakId
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountIndependentTransmissionChains(outbreakId: string): Observable<MetricIndependentTransmissionChainsModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/independent-transmission-chains/filtered-count`),
            MetricIndependentTransmissionChainsModel
        );
    }
//  {data: {id: 'j', name: 'Jerry', nodeColor: '#6FB1FC', faveShape: 'triangle'}},
    convertChainToGraphElements(transmissionChain: TransmissionChainModel) {
       let graphData: any = {};
       if ( !_.isEmpty(transmissionChain) ) {
           if( !_.isEmpty ( transmissionChain.nodes) ) {
               _.forEach( transmissionChain.nodes, function(node, key) {
                   graphData.nodes.
               });
           }

       }

    }
}

