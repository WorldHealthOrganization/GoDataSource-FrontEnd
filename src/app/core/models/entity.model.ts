import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { CaseModel } from './case.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';
import { LabelValuePair } from './label-value-pair';
import { AddressModel } from './address.model';

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
    private static uniqueValueOptions(
        records: EntityModel[],
        path: string,
        valueParser: (value: any) => any,
        labelValueMap: (value: any) => LabelValuePair,
    ): { options: LabelValuePair[], value: any } {
        // construct options
        const options: LabelValuePair[] = _.chain(records)
            .map((record: EntityModel) => _.get(record.model, path))
            .filter((value) => value !== '' && value !== undefined && value !== null)
            .uniqBy((value: any) => valueParser(value))
            .map((value) => labelValueMap(value))
            .value();

        // finished
        return {
            options: options,
            value: options.length === 1 ?
                options[0].value : undefined
        };
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueStringOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            (value) => _.isString(value) ? value.toLowerCase() : value,
            (value) => new LabelValuePair(value, value)
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueDateOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value,
            (value) => new LabelValuePair(value, value)
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueBooleanOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
            (value) => new LabelValuePair(value ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO', value)
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueAddressOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value,
            (value) => new LabelValuePair((value as AddressModel).fullAddress, value)
        );
    }
}
