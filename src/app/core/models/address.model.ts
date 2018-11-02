import * as _ from 'lodash';
import { LocationModel } from './location.model';
import { RequestFilter, RequestQueryBuilder } from '../helperClasses/request-query-builder';
import * as moment from 'moment';

// addresses types
export enum AddressType {
    PREVIOUS_ADDRESS = 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_PREVIOUS_USUAL_PLACE_OF_RESIDENCE',
    CURRENT_ADDRESS = 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_USUAL_PLACE_OF_RESIDENCE'
}

export class AddressModel {
    typeId: string;
    city: string;
    postalCode: string;
    addressLine1: string;
    locationId: string;
    location: LocationModel;
    date: string;
    geoLocation: { lat: number, lng: number } | null;

    constructor(data = null, locationsList = []) {
        this.typeId = _.get(data, 'typeId');
        this.city = _.get(data, 'city');
        this.postalCode = _.get(data, 'postalCode');
        this.addressLine1 = _.get(data, 'addressLine1');
        this.locationId = _.get(data, 'locationId');
        this.location = new LocationModel(
            _.find(locationsList, {id: this.locationId})
        );
        this.date = _.get(data, 'date', moment().toISOString());
        this.geoLocation = _.get(data, 'geoLocation', {});
    }

    get fullAddress() {
        // construct address
        let fullAddress = _.isEmpty(this.addressLine1) ? '' : this.addressLine1;
        fullAddress += _.isEmpty(this.city) ? '' : (
            (_.isEmpty(fullAddress) ? '' : ', ') +
            this.city
        );

        // finished
        return fullAddress;
    }

    /**
     * Create query builder that will search an address
     */
    static buildSearchFilter(
        address: string,
        property: string
    ): RequestQueryBuilder {
        // initialize query builder
        const qb = new RequestQueryBuilder();

        // add filters
        const matches: string[] = address.match(/(\w+\s*)+/gi);
        if (
            matches &&
            matches.length > 0
        ) {
            // add conditions
            const conditions: any[] = [];
            matches.forEach((searchTerm: string) => {
                conditions.push({
                    or: [{
                        [property + '.city']: {
                            like: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                            options: 'i'
                        }
                    }, {
                        [property + '.postalCode']: {
                            like: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                            options: 'i'
                        }
                    }, {
                        [property + '.addressLine1']: {
                            like: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                            options: 'i'
                        }
                    }]
                });
            });

            // we use elemMatch because of a loopback v3 bug
            qb.filter.where({
                and: conditions
            }, false);

            // finished
            return qb;
        }

        // nothing to search for
        return null;
    }

    /**
     * Clone class
     */
    sanitize(): Object {
        // create clone
        const address = _.cloneDeep(this);

        // remove properties that we don't want to save
        delete address.location;

        // finished
        return address;
    }
}
