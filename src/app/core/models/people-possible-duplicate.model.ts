import * as _ from 'lodash';
import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';

export class PeoplePossibleDuplicateGroupModel {
    duplicateKey: string;
    indexKey: string;
    peopleIds: string[];

    constructor(data = null) {
        this.duplicateKey = _.get(data, 'duplicateKey');
        this.indexKey = _.get(data, 'indexKey');
        this.peopleIds = _.get(data, 'peopleIds', []);
    }
}

export class PeoplePossibleDuplicateModel {
    peopleMap: {
        [id: string]: CaseModel | ContactModel | EventModel
    };
    groups: PeoplePossibleDuplicateGroupModel[];

    constructor(data = null) {
        this.peopleMap = _.transform(_.get(data, 'peopleMap'), (result, value: any, id: string) => {
            switch (value.type) {
                case EntityType.CASE:
                    result[id] = new CaseModel(value);
                    break;
                case EntityType.CONTACT:
                    result[id] = new ContactModel(value);
                    break;
                case EntityType.EVENT:
                    result[id] = new EventModel(value);
                    break;
                default:
                    console.log('WTF ?');
            }
        }, {});
        this.groups = _.map(_.get(data, 'groups'), (item) => {
            return new PeoplePossibleDuplicateGroupModel(item);
        });
    }
}
