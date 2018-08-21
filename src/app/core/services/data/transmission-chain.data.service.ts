import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { TransmissionChainModel } from '../../models/transmission-chain.model';
import { MetricIndependentTransmissionChainsModel } from '../../models/metrics/metric-independent-transmission-chains.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { GraphNodeModel } from '../../models/graph-node.model';
import { GraphEdgeModel } from '../../models/graph-edge.model';

@Injectable()
export class TransmissionChainDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Map Transmission chain to Chain model
     */
    private mapTransmissionChainToModel(result) {
        const nodes = _.get(result, 'nodes', {});
        const edges = _.get(result, 'edges', {});
        const transmissionChains = _.get(result, 'transmissionChains.chains', []);

        return _.map(transmissionChains, (chain) => {
            return new TransmissionChainModel(chain, nodes, Object.values(edges));
        });
    }

    /**
     * Retrieve the list of Independent Transmission Chains
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getIndependentTransmissionChainsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`
        ).map(this.mapTransmissionChainToModel);
    }

    /**
     * Retrieve the list of New Transmission Chains from contacts who became cases
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getTransmissionChainsFromContactsWhoBecameCasesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases?filter=${filter}`
        ).map(this.mapTransmissionChainToModel);
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

    /**
     * Get the number of new chains of transmission from registered contacts who became cases
     * @param {string} outbreakId
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(outbreakId: string): Observable<MetricIndependentTransmissionChainsModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`/outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases/filtered-count`),
            MetricIndependentTransmissionChainsModel);
    }
}

