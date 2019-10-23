import * as _ from 'lodash';
import { LocationModel } from './location.model';
import { RequestFilter, RequestQueryBuilder } from '../helperClasses/request-query-builder';
import { moment } from '../helperClasses/x-moment';

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
    geoLocation: { lat: number, lng: number };
    geoLocationAccurate: boolean = false;
    phoneNumber: string;

    /**
     * Search for current address
     * @param addresses
     * @returns {AddressModel | undefined}
     */
    static getCurrentAddress(addresses: AddressModel[]): AddressModel {
        return _.find(addresses, { typeId: AddressType.CURRENT_ADDRESS });
    }

    constructor(data = null, locationsList: LocationModel[] = []) {
        this.typeId = _.get(data, 'typeId');
        this.city = _.get(data, 'city');
        this.postalCode = _.get(data, 'postalCode');
        this.addressLine1 = _.get(data, 'addressLine1');
        this.locationId = _.get(data, 'locationId');
        this.location = locationsList && locationsList.length > 0 ?
            new LocationModel(
                _.find(locationsList, {id: this.locationId})
            ) :
            new LocationModel(_.get(data, 'location'));
        this.date = _.get(data, 'date', moment().toISOString());
        this.geoLocation = _.get(data, 'geoLocation', {});
        this.geoLocationAccurate = _.get(data, 'geoLocationAccurate', false);
        this.phoneNumber = _.get(data, 'phoneNumber');
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
        property: string,
        propertyIsArray: boolean
    ): RequestQueryBuilder {
        // initialize query builder
        const qb = new RequestQueryBuilder();

        // add filters
        const matches: string[] = address.match(/\w+/gi);
        if (
            matches &&
            matches.length > 0
        ) {
            // construct query accordingly to property type ( array of objects / single object )
            const conditions: any[] = [];
            if (propertyIsArray) {
                // add conditions
                matches.forEach((searchTerm: string) => {
                    conditions.push({
                        $or: [{
                            city: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            postalCode: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            addressLine1: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            phoneNumber: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }]
                    });
                });

                // search
                qb.filter.where({
                    [property]: {
                        elemMatch: {
                            $and: conditions
                        }
                    }
                }, false);
            } else {
                // add conditions
                matches.forEach((searchTerm: string) => {
                    conditions.push({
                        $or: [{
                            [`${property}.city`]: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            [`${property}.postalCode`]: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            [`${property}.addressLine1`]: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }, {
                            [`${property}.phoneNumber`]: {
                                $regex: '.*' + RequestFilter.escapeStringForRegex(searchTerm) + '.*',
                                $options: 'i'
                            }
                        }]
                    });
                });

                // search
                qb.filter.where({
                    $and: conditions
                }, false);
            }

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
