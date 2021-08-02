import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { map } from 'rxjs/operators';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { IBasicCount } from '../../models/basic-count.interface';
import { RequestFilterGenerator } from '../../../core/helperClasses/request-query-builder';

@Injectable()
export class GlobalEntitySearchDataService {
    /**
     * Generates the search value condition
     */
    generateSearchValueCondition(searchValue: string): any {
        return _.isEmpty(searchValue) ?
            {} : {
                or: [
                    {
                        id: RequestFilterGenerator.textContains(searchValue, false)
                    },
                    {
                        visualId: RequestFilterGenerator.textContains(searchValue, false)
                    },
                    {
                        'documents.number': RequestFilterGenerator.textContains(searchValue, true)
                    }
                ]
            };
    }

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient
    ) {}

    /**
     * Return the entity matched by identifier
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<(CaseModel | ContactModel | EventModel)[]>}
     */
    searchEntity(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {
        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/people?filter=${filter}`)
            .pipe(
                map((peopleList) => {
                    return _.map(peopleList, (entity) => {
                        return new EntityModel(entity).model;
                    });
                })
            );
    }

    /**
     * Return the count of people items matched by identifier
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    searchEntityCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        // construct query
        const whereFilter = queryBuilder.filter.generateCondition(true);

        // get the items count
        return this.http.get(`outbreaks/${outbreakId}/people/count?where=${whereFilter}`);
    }
}
