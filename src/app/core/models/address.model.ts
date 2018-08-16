import * as _ from 'lodash';
import { LocationModel } from './location.model';
import { RequestFilter, RequestQueryBuilder } from '../helperClasses/request-query-builder';

export class AddressModel {
    name: string;
    city: string;
    postalCode: string;
    addressLine1: string;
    locationId: string;
    location: LocationModel;

    constructor(data = null) {
        this.name = _.get(data, 'name');
        this.city = _.get(data, 'city');
        this.postalCode = _.get(data, 'postalCode');
        this.addressLine1 = _.get(data, 'addressLine1');
        this.locationId = _.get(data, 'locationId');
        this.location = _.get(data, 'location');
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
                    $or: [{
                        'city': {
                            $regex: RequestFilter.escapeStringForRegex(searchTerm),
                            $options: 'i'
                        }
                    }, {
                        'postalCode': {
                            $regex: RequestFilter.escapeStringForRegex(searchTerm),
                            $options: 'i'
                        }
                    }, {
                        'addressLine1': {
                            $regex: RequestFilter.escapeStringForRegex(searchTerm),
                            $options: 'i'
                        }
                    }]
                });
            });

            // we use elemMatch because of a loopback v3 bug
           qb.filter.where({
                [property]: {
                    elemMatch: {
                        $and: conditions
                    }
                }
            }, false);

            // finished
            return qb;
        }

        // nothing to search for
        return null;
    }
}
