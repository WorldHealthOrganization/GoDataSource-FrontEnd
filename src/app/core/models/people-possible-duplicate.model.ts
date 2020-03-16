import * as _ from 'lodash';
import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';
import { IPermissionDuplicates } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class PeoplePossibleDuplicateGroupModel {
    duplicateKey: string;
    indexKey: string;
    peopleIds: string[];
    groupType: EntityType;

    constructor(data = null) {
        this.duplicateKey = _.get(data, 'duplicateKey');
        this.indexKey = _.get(data, 'indexKey');
        this.peopleIds = _.get(data, 'peopleIds', []);
    }
}

export class PeoplePossibleDuplicateModel
    implements
        IPermissionDuplicates {
    peopleMap: {
        [id: string]: CaseModel | ContactModel | EventModel
    };
    groups: PeoplePossibleDuplicateGroupModel[];

    /**
     * Static Permissions - IPermissionDuplicates
     */
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DUPLICATE_LIST) : false; }
    static canMergeCases(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DUPLICATE_MERGE_CASES) : false; }
    static canMergeContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DUPLICATE_MERGE_CONTACTS) : false; }
    static canMergeEvents(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DUPLICATE_MERGE_EVENTS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        // map people
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
            }
        }, {});

        // map groups
        this.groups = _.map(_.get(data, 'groups'), (item) => {
            // create new group
            const group: PeoplePossibleDuplicateGroupModel = new PeoplePossibleDuplicateGroupModel(item);

            // determine group type
            const groupTypes: EntityType[] = Object.keys(_.groupBy(
                group.peopleIds
                    .map((id: string) => this.peopleMap[id])
                    .filter((people: CaseModel | ContactModel | EventModel) => !!people),
                (people: CaseModel | ContactModel | EventModel) => people.type
            )) as EntityType[];
            if (groupTypes.length === 1) {
                group.groupType = groupTypes[0];
            } else {
                // NOT SUPPORTED
            }

            // return group
            return group;
        });
    }

    /**
     * Permissions - IPermissionDuplicates
     */
    canList(user: UserModel): boolean { return PeoplePossibleDuplicateModel.canList(user); }
    canMergeCases(user: UserModel): boolean { return PeoplePossibleDuplicateModel.canMergeCases(user); }
    canMergeContacts(user: UserModel): boolean { return PeoplePossibleDuplicateModel.canMergeContacts(user); }
    canMergeEvents(user: UserModel): boolean { return PeoplePossibleDuplicateModel.canMergeEvents(user); }
}
