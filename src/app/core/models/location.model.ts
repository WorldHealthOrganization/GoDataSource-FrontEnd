import * as _ from 'lodash';

export class LocationModel {
    id: string;
    name: string;
    synonyms: string[];
    active: boolean;
    populationDensity: number;
    parentLocationId: string;
    geoLocation: { lat: number, lng: number } | null;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.synonyms = _.get(data, 'synonyms', []);
        this.active = _.get(data, 'active', true);
        this.populationDensity = _.get(data, 'populationDensity', 0);
        this.parentLocationId = _.get(data, 'parentLocationId');
        this.geoLocation = _.get(data, 'geoLocation', {});
    }

    get synonymsAsString(): string {
        return this.synonyms.join(' / ');
    }
}
