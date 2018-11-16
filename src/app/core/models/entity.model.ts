import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { CaseModel } from './case.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';
import { LabelValuePair } from './label-value-pair';

/**
 * Model representing a Case, a Contact or an Event
 */
export class EntityModel {
    type: EntityType;
    model: CaseModel | ContactModel | EventModel;

    constructor(data) {
        this.type = _.get(data, 'type');

        switch (this.type) {
            case EntityType.CASE:
                this.model = new CaseModel(data);
                break;

            case EntityType.CONTACT:
                this.model = new ContactModel(data);
                break;

            case EntityType.EVENT:
                this.model = new EventModel(data);
                break;
        }
    }

    static getLinkForEntityType(entityType: EntityType): string {
        let entityTypeLink = '';
        switch (entityType) {
            case EntityType.CASE:
                entityTypeLink = 'cases';
                break;
            case EntityType.CONTACT:
                entityTypeLink = 'contacts';
                break;
            case EntityType.EVENT:
                entityTypeLink = 'events';
                break;
        }

        return entityTypeLink;
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueValueOptions(
        records: EntityModel[],
        path: string
    ): LabelValuePair[] {
        return _.chain(records)
            .map((record: EntityModel) => _.get(record.model, path))
            .uniqBy((value: any) => _.isString(value) ? value.toLowerCase() : value)
            .value();
    }
}
