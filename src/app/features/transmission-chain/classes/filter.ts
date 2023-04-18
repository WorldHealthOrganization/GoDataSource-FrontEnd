import { IV2NumberRange } from '../../../shared/forms-v2/components/app-form-number-range-v2/models/number.model';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { IV2DateRange } from '../../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';

export class TransmissionChainFilters {
  classificationId: string[];
  occupation: string[];
  outcomeId: string[];
  firstName: string;
  lastName: string;
  labSequenceResult?: string[];
  gender: string[];
  locationIds: string[];
  clusterIds: string[];
  age: IV2NumberRange;
  date: IV2DateRange;
  includeContactsOfContacts: boolean;

  showContacts?: boolean;
  showEvents?: boolean;

  /**
   * Constructor
   * @param data
   */
  constructor(data: {
    classificationId?: string[],
    occupation?: string[],
    outcomeId?: string[],
    firstName?: string,
    lastName?: string,
    labSequenceResult?: string[],
    gender?: string[],
    locationIds?: string[],
    clusterIds?: string[],
    age?: IV2NumberRange,
    date?: IV2DateRange,
    includeContactsOfContacts?: boolean
  } = {}) {
    // assign properties
    Object.assign(
      this,
      data
    );
  }

  /**
   * Attach conditions to query builder
   */
  attachConditionsToRequestQueryBuilder(qb: RequestQueryBuilder) {
    // clusterIds
    if (!_.isEmpty(this.clusterIds)) {
      const relationshipQueryBuilder = qb.addChildQueryBuilder('relationship');
      relationshipQueryBuilder.filter.where({
        clusterId: {
          inq: this.clusterIds
        }
      });
    }

    // Lab result variant/strain result
    if (!_.isEmpty(this.labSequenceResult)) {
      const labResultQueryBuilder = qb.addChildQueryBuilder('labResult');
      labResultQueryBuilder.filter.where({
        'sequence.resultId': {
          inq: this.labSequenceResult
        }
      });
    }

    // case classification
    if (!_.isEmpty(this.classificationId)) {
      qb.filter.where({
        or: [
          {
            type: {
              neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
            }
          }, {
            type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
            classification: {
              inq: this.classificationId
            }
          }
        ]
      });
    }

    // occupation
    if (!_.isEmpty(this.occupation)) {
      qb.filter.where({
        and: [{
          occupation: {
            inq: this.occupation
          }
        }]
      });
    }

    // outcome
    if (!_.isEmpty(this.outcomeId)) {
      qb.filter.where({
        and: [{
          outcomeId: {
            inq: this.outcomeId
          }
        }]
      });
    }

    // firstName
    if (!_.isEmpty(this.firstName)) {
      qb.filter.byText(
        'firstName',
        this.firstName
      );
    }

    // lastName
    if (!_.isEmpty(this.lastName)) {
      qb.filter.byText(
        'lastName',
        this.lastName
      );
    }

    // gender
    if (!_.isEmpty(this.gender)) {
      qb.filter.bySelect(
        'gender',
        this.gender,
        true,
        null
      );
    }

    // location
    if (!_.isEmpty(this.locationIds)) {
      qb.filter.where({
        or: [
          {
            type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
            'address.parentLocationIdFilter': {
              inq: this.locationIds
            }
          }, {
            type: {
              inq: !this.includeContactsOfContacts ?
                [
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                ] :
                [
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT',
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT_OF_CONTACT'
                ]
            },
            'addresses.parentLocationIdFilter': {
              inq: this.locationIds
            }
          }
        ]
      });
    }

    // age
    if (!_.isEmpty(this.age)) {
      qb.filter.byAgeRange(
        'age',
        this.age
      );
    }

    // date of reporting
    if (!_.isEmpty(this.date)) {
      qb.filter.byDateRange(
        'dateOfReporting',
        this.date
      );
    }
  }
}
