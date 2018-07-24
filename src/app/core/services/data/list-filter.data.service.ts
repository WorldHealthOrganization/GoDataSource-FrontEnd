import { Injectable } from '@angular/core';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakDataService } from './outbreak.data.service';
import { FollowUpsDataService } from './follow-ups.data.service';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../models/outbreak.model';
import { until } from 'selenium-webdriver';

@Injectable()
export class ListFilterDataService {

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpDataService: FollowUpsDataService
    ) {}


    private handleFilteringOfLists(callback): Observable<RequestQueryBuilder> {
        return this.outbreakDataService
            .getSelectedOutbreakSubject()
            .mergeMap((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    return callback(selectedOutbreak);
                } else {
                    return Observable.of(new RequestQueryBuilder());
                }
            });
    }

    /**
     * Create the query builder for filtering the list of contacts
     * @returns {RequestQueryBuilder}
     */
    filterContactsOnFollowUpListsFromDashboard(): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id)
                .map((result) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.contactIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

}
