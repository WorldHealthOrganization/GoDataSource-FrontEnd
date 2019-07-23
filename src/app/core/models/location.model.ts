import * as _ from 'lodash';
import { LocationIdentifierModel } from './location-identifier.model';
import { BaseModel } from './base.model';

export class LocationModel extends BaseModel {
    id: string;
    name: string;
    synonyms: string[];
    active: boolean;
    disabled: boolean;
    populationDensity: number;
    parentLocationId: string;
    geoLocation: { lat: number, lng: number } | null;
    geographicalLevelId: string;
    identifiers: LocationIdentifierModel[];

    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.synonyms = _.get(data, 'synonyms', []);
        this.active = _.get(data, 'active', true);
        this.disabled = _.get(data, 'disabled', false);
        this.populationDensity = _.get(data, 'populationDensity', 0);
        this.parentLocationId = _.get(data, 'parentLocationId');
        this.geoLocation = _.get(data, 'geoLocation', {});
        this.geographicalLevelId = _.get(data, 'geographicalLevelId');
        this.identifiers = _.get(data, 'identifiers', []);
    }

    get synonymsAsString(): string {
        return this.synonyms.join(' / ');
    }

    get identifiersAsString(): string {
        return _.map(this.identifiers, (identifier) => {
            return identifier.code;
        }).join(' / ');
    }
}
