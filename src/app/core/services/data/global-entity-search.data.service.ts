import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/mergeMap';
import * as _ from 'lodash';
import { EntityModel } from '../../models/entity.model';

@Injectable()
export class GlobalEntitySearchDataService {

    constructor(
        private http: HttpClient
    ) {}

    /**
     * Return the entity matched by identifier
     * @param {string} outbreakId
     * @param {string} globalSearchValue
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<(CaseModel | ContactModel | EventModel)[]>}
     */
    searchEntity(
        outbreakId: string,
        globalSearchValue: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel)[]> {

        const qb = new RequestQueryBuilder();

        qb.filter.firstLevelConditions();
        // add condition for identifier
        qb.filter.where({
            identifier: globalSearchValue
        }, true);

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/people?filter=${filter}`)
            .map((peopleList) => {
                return _.map(peopleList, (entity) => {
                    return new EntityModel(entity).model;
                });
            });
    }
}

