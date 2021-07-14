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

        const qb = new RequestQueryBuilder();

        qb.filter.firstLevelConditions();
        // add condition for identifier
        qb.filter.where({
            identifier: encodeURIComponent(globalSearchValue)
        }, true);

        qb.merge(queryBuilder);

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
        // create condition
        const whereFilter = JSON.stringify({identifier: encodeURIComponent(globalSearchValue)});

        // get the items count
        return this.http.get(`outbreaks/${outbreakId}/people/count?where=${whereFilter}`);
    }
}
