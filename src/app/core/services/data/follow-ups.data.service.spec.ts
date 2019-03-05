import { Observable } from 'rxjs/Observable';
import { OutbreakDataServiceMock } from './outbreak.data.service.spec';
import * as _ from 'lodash';
import { FollowUpModel } from '../../models/follow-up.model';
import { ContactDataServiceMock } from './contact.data.service.spec';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as moment from 'moment';

export class FollowUpsDataServiceMock {
    static selectedFollowUpId = 'followUp 1';

    static followUps: {
        [outbreakId: string]: {
            [contactId: string]: FollowUpModel[]
        }
    } = {
        [OutbreakDataServiceMock.selectedOutbreakId]: {
            [ContactDataServiceMock.selectedContactId]: [
                new FollowUpModel({
                    id: FollowUpsDataServiceMock.selectedFollowUpId,
                    personId: ContactDataServiceMock.selectedContactId,
                    date: moment('2019-03-05', 'YYYY-MM-DD'),
                    statusId: 'Status 1'
                }),
                new FollowUpModel({
                    id: 'followUp 2',
                    personId: ContactDataServiceMock.selectedContactId,
                    date: moment('2019-03-10', 'YYYY-MM-DD'),
                    statusId: 'Status 2'
                }),
                new FollowUpModel({
                    id: 'followUp 3',
                    personId: ContactDataServiceMock.selectedContactId,
                    date: moment('2019-03-7', 'YYYY-MM-DD'),
                    statusId: 'Status 3'
                })
            ],
            'contact 2': [
                new FollowUpModel({
                    id: 'followUp 4',
                    personId: 'contact 2',
                    date: moment('2019-03-06', 'YYYY-MM-DD'),
                    statusId: 'Status 2'
                })
            ]
        }
    };

    static getInstance() {
        return new FollowUpsDataServiceMock();
    }

    getContactFollowUpsList(
        outbreakId: string,
        contactId: string,
    ): Observable<FollowUpModel[]> {
        return Observable.of(
            FollowUpsDataServiceMock.followUps[outbreakId] && FollowUpsDataServiceMock.followUps[outbreakId][contactId] ?
                FollowUpsDataServiceMock.followUps[outbreakId][contactId] :
                []
        );
    }

    getFollowUpsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
        needsContactData: boolean = true
    ): Observable<FollowUpModel[]> {
        // retrieve all follow-ups from this outbreak
        const items = FollowUpsDataServiceMock.followUps[outbreakId] ?
            _.transform(FollowUpsDataServiceMock.followUps[outbreakId], (accumulator, followUps) => {
                _.each(followUps, (followUp) => {
                    accumulator.push(followUp);
                });
            }, []) :
            [];

        // filter
        let personId: string;
        if (queryBuilder.filter.has('personId')) {
            // retrieve person id
            const qb = new RequestQueryBuilder();
            qb.merge(queryBuilder);
            qb.filter.firstLevelConditions();
            personId = qb.filter.generateCondition().personId;
        }

        // finished
        return Observable.of(personId ? _.filter(items, { personId: personId }) : items);
    }
}

