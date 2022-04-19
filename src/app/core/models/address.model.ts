import * as _ from 'lodash';
import { LocationModel } from './location.model';
import {
  RequestFilter,
  RequestFilterGenerator,
  RequestQueryBuilder
} from '../helperClasses/request-query-builder';
import { Moment, moment } from '../helperClasses/x-moment';

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
  date: string | Moment;
  geoLocation: { lat: number, lng: number };
  geoLocationAccurate: boolean = false;
  phoneNumber: string;
  emailAddress: string;

  // used by ui
  filterLocationIds: string[];

  /**
     * Search for current address
     * @param addresses
     * @returns {AddressModel | undefined}
     */
  static getCurrentAddress(addresses: AddressModel[]): AddressModel {
    return _.find(addresses, { typeId: AddressType.CURRENT_ADDRESS });
  }

  /**
     * Constructor
     */
  constructor(
    data = null,
    locationsMap?: {
      [locationId: string]: LocationModel
    }
  ) {
    this.typeId = _.get(data, 'typeId');
    this.city = _.get(data, 'city');
    this.postalCode = _.get(data, 'postalCode');
    this.addressLine1 = _.get(data, 'addressLine1');
    this.locationId = _.get(data, 'locationId');
    this.location = locationsMap && this.locationId ?
      locationsMap[this.locationId] :
      new LocationModel(_.get(data, 'location'));
    this.date = _.get(data, 'date', moment().toISOString());
    this.geoLocation = _.get(data, 'geoLocation', {});
    this.geoLocationAccurate = _.get(data, 'geoLocationAccurate', false);
    this.phoneNumber = _.get(data, 'phoneNumber');
    this.emailAddress = _.get(data, 'emailAddress');
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
    // nothing provided ?
    if (!address) {
      return null;
    }

    // add filters
    const matches: string[] = address.match(/\w+/gi);
    if (
      !matches ||
            matches.length < 1
    ) {
      return null;
    }

    // initialize query builder
    const qb = new RequestQueryBuilder();

    // construct query accordingly to property type ( array of objects / single object )
    const conditions: any[] = [];
    if (propertyIsArray) {
      // add conditions
      matches.forEach((searchTerm: string) => {
        // construct or condition
        const or: any[] = [{
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
        }];

        // check if we should search for phone number as well
        const numberPattern: string = RequestFilter.getPhoneNumberPattern(searchTerm);
        if (numberPattern) {
          or.push({
            phoneNumber: {
              $regex: numberPattern
            }
          });
        }

        // add or to list of conditions to check
        conditions.push({
          $or: or
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
        // construct or condition
        const or: any[] = [{
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
        }];

        // check if we should search for phone number as well
        const numberPattern: string = RequestFilter.getPhoneNumberPattern(searchTerm);
        if (numberPattern) {
          or.push({
            [`${property}.phoneNumber`]: {
              $regex: numberPattern
            }
          });
        }

        // add or to list of conditions to check
        conditions.push({
          $or: or
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

  /**
     * Create query builder that will filter an address
     */
  static buildAddressFilter(
    property: string,
    isArray: boolean,
    addressModel: AddressModel,
    addressParentLocationIds: string[],
    useLike: boolean = false
  ): RequestQueryBuilder {
    // initialize query builder
    const qb = new RequestQueryBuilder();

    // create a query that collects the address inputs
    const query: { [key: string]: {} } = {};

    // collect the address inputs to create the query
    if (isArray) {
      // check for address
      if (addressModel.addressLine1) {
        query.addressLine1 = {
          // text start with
          $regex: '^' +
            RequestFilter.escapeStringForRegex(addressModel.addressLine1)
              .replace(/%/g, '.*')
              .replace(/\\\?/g, '.'),
          $options: 'i'
        };
      }

      // check for city
      if (addressModel.city) {
        query.city = {
          // text start with
          $regex: '^' +
            RequestFilter.escapeStringForRegex(addressModel.city)
              .replace(/%/g, '.*')
              .replace(/\\\?/g, '.'),
          $options: 'i'
        };
      }

      // check for email address
      if (addressModel.emailAddress) {
        query.emailAddress = {
          // text start with
          $regex: '^' +
            RequestFilter.escapeStringForRegex(addressModel.emailAddress)
              .replace(/%/g, '.*')
              .replace(/\\\?/g, '.'),
          $options: 'i'
        };
      }

      // check for postalCode
      if (addressModel.postalCode) {
        query.postalCode = {
          // text start with
          $regex: '^' +
            RequestFilter.escapeStringForRegex(addressModel.postalCode)
              .replace(/%/g, '.*')
              .replace(/\\\?/g, '.'),
          $options: 'i'
        };
      }

      // check for phone number
      if (addressModel.phoneNumber) {
        // build number pattern condition
        const phonePattern = RequestFilter.getPhoneNumberPattern(addressModel.phoneNumber);
        query.phoneNumber = !phonePattern ?
          'INVALID PHONE' :
          {
            $regex: phonePattern
          };
      }

      // check for locations
      if (
        addressParentLocationIds &&
        addressParentLocationIds.length > 0
      ) {
        query.parentLocationIdFilter = {
          $in: addressParentLocationIds
        };
      }

      // check for geo location accurate
      if (
        addressModel.geoLocationAccurate === false ||
        addressModel.geoLocationAccurate === true
      ) {
        query.geoLocationAccurate = {
          [addressModel.geoLocationAccurate === false ? '$ne' : '$eq']: true
        };
      }
    } else {
      // check for address
      if (addressModel.addressLine1) {
        query[`${property}.addressLine1`] = RequestFilterGenerator.textStartWith(addressModel.addressLine1, useLike);
      }

      // check for city
      if (addressModel.city) {
        query[`${property}.city`] = RequestFilterGenerator.textStartWith(addressModel.city, useLike);
      }

      // check for email address
      if (addressModel.emailAddress) {
        query[`${property}.emailAddress`] = RequestFilterGenerator.textStartWith(addressModel.emailAddress, useLike);
      }

      // check for postal code
      if (addressModel.postalCode) {
        query[`${property}.postalCode`] = RequestFilterGenerator.textStartWith(addressModel.postalCode, useLike);
      }

      // check for geo location accurate
      if (
        addressModel.geoLocationAccurate === false ||
        addressModel.geoLocationAccurate === true
      ) {
        query[`${property}.geoLocationAccurate`] = {
          [addressModel.geoLocationAccurate === false ? 'ne' : 'eq']: true
        };
      }

      // check for phone number
      if (addressModel.phoneNumber) {
        // build number pattern condition
        const phonePattern = RequestFilter.getPhoneNumberPattern(addressModel.phoneNumber);

        query[`${property}.phoneNumber`] = !phonePattern ?
          'INVALID PHONE' :
          {
            [useLike ? 'regex' : '$regex']: phonePattern
          };
      }

      // check for locations
      if (
        addressParentLocationIds &&
        addressParentLocationIds.length > 0
      ) {
        query[`${property}.parentLocationIdFilter`] = {
          inq: addressParentLocationIds
        };
      }
    }

    // check if there are conditions to add
    if (Object.keys(query).length > 0) {
      // add the conditions for the current address only
      if (isArray) {
        // add the conditions for the current address only
        query.typeId = AddressType.CURRENT_ADDRESS;

        // add the conditions
        qb.filter.where({
          [property]: {
            elemMatch: query
          }
        });
      } else {
        qb.filter.where(query);
      }
    }

    // finished
    return qb;
  }

  /**
     * Create query builder that will search for a phone number
     */
  static buildPhoneSearchFilter(
    phoneNumber: string,
    property: string,
    propertyIsArray: boolean
  ): RequestQueryBuilder {
    // construct search pattern
    const numberPattern: string = RequestFilter.getPhoneNumberPattern(phoneNumber);

    // initialize query builder
    const qb = new RequestQueryBuilder();

    // nothing provided ?
    if (!numberPattern) {
      // filter by invalid value ?
      if (phoneNumber) {
        // add invalid condition
        qb.filter.where({
          [property]: 'INVALID PHONE'
        }, false);

        // finished
        return qb;
      }

      // finished
      return null;
    }

    // construct query accordingly to property type ( array of objects / single object )
    if (propertyIsArray) {
      qb.filter.where({
        [property]: {
          elemMatch: {
            phoneNumber: {
              $regex: numberPattern
            }
          }
        }
      }, false);
    } else {
      qb.filter.where({
        [`${property}.phoneNumber`]: {
          $regex: numberPattern
        }
      }, false);
    }

    // finished
    return qb;
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
