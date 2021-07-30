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
    // store search value
    private _searchValue: string;
    set searchValue(data: string) {
        this._searchValue = data;
    }

    get searchValue(): string {
        return this._searchValue;
    }

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient
    ) {}

    /**
     * Returns the search value condition
     * @param {string} searchValue
     * @returns {any}
     */
    private createSearchValueCondition(searchValue: string): any {
        return {
            or: [
                {
                    id: RequestFilterGenerator.textContains(searchValue, false)
                },
                {
                    visualId: RequestFilterGenerator.textContains(searchValue, false)
                },
                {
                    'documents.number': RequestFilterGenerator.textContains(searchValue, false)
                }
            ]
        };
    }

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
    ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {
        // create filter
        const qb = new RequestQueryBuilder();
        qb.merge(queryBuilder);
        qb.filter.where(this.createSearchValueCondition(globalSearchValue), true);

        // construct query
        const filter = qb.buildQuery();
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
     * @param {string} globalSearchValue
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    searchEntityCount(
        outbreakId: string,
        globalSearchValue: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        // create filter
        const qb = new RequestQueryBuilder();
        qb.merge(queryBuilder);
        qb.filter.where(this.createSearchValueCondition(globalSearchValue), true);

        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/people/filtered-count?filter=${filter}`);
    }
}
