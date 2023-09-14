import { ApplyListFilter, Constants } from '../models/constants';
import { RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';
import { AddressType } from '../models/address.model';
import { MetricContactsSeenEachDays } from '../models/metrics/metric-contacts-seen-each-days.model';
import { ContactFollowedUp, MetricContactsWithSuccessfulFollowUp } from '../models/metrics/metric.contacts-with-success-follow-up.model';
import { moment, Moment } from './x-moment';
import { ListHelperService } from '../services/helper/list-helper.service';
import { ListQueryComponent } from './list-query-component';
import { IV2Column } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2ColumnToVisibleMandatoryConf } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

/**
 * Applied filters
 */
export abstract class ListAppliedFiltersComponent<T extends (IV2Column | IV2ColumnToVisibleMandatoryConf)> extends ListQueryComponent<T> {
  // Applied list filter on this list page
  appliedListFilter: ApplyListFilter;

  // Preparing loading filter ?
  protected appliedListFilterLoading: boolean = false;

  // List Filter Query Builder
  protected appliedListFilterQueryBuilder: RequestQueryBuilder;

  // timers
  private _applyListFiltersTimer: number;

  /**
   * Constructor
   */
  protected constructor(
    protected listHelperService: ListHelperService,
    queryBuilderChangedCallback: () => void,
    private refreshCallback: (
      instant?: boolean,
      resetPagination?: boolean,
      triggeredByPageChange?: boolean
    ) => void
  ) {
    super(
      listHelperService,
      queryBuilderChangedCallback,
      refreshCallback
    );
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // stop timers
    this.stopApplyListFiltersTimer();
  }

  /**
   * Retrieve Global Filter Values
   */
  protected getGlobalFilterValues(queryParams: {
    global?: string | {
      date?: Moment,
      locationId?: string,
      classificationId?: string[]
    }
  }):
    {
      date?: Moment,
      locationId?: string,
      classificationId?: string[]
    }
  {
    // do we need to decode global filters ?
    const global: {
      date?: Moment,
      locationId?: string,
      classificationId?: string[]
    } = !queryParams.global ?
      {} : (
        _.isString(queryParams.global) ?
          JSON.parse(queryParams.global as string) :
          queryParams.global
      );

    // parse date
    if (global.date) {
      global.date = moment(global.date);
    }

    // finished
    return global;
  }

  /**
   * Apply list filter
   */
  protected mergeListFilterToMainFilter() {
    // finished with list filter
    this.appliedListFilterLoading = false;

    // merge filter query builder
    if (this.appliedListFilterQueryBuilder) {
      this.queryBuilder.merge(_.cloneDeep(this.appliedListFilterQueryBuilder));
    }
  }

  /**
   * Verify what list filter is sent into the query params and updates the query builder based in this.
   */
  protected applyListFilters(
    queryParams: {
      applyListFilter,
      x,
      date,
      global
    }
  ): void {
    // there are no filters to apply ?
    if (!this.appliedListFilter) {
      return;
    }

    // get global filter values
    const globalFilters = this.getGlobalFilterValues(queryParams);
    let globalQb: RequestQueryBuilder;

    // check params for apply list filter
    switch (this.appliedListFilter) {
      // Filter contacts on the followup list
      case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:

        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService
          .filterContactsOnFollowUpLists(
            globalFilters.date,
            globalFilters.locationId,
            globalFilters.classificationId
          )
          .subscribe((qbFilterContactsOnFollowUpLists) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterContactsOnFollowUpLists;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // filter cases deceased
      case Constants.APPLY_LIST_FILTER.CASES_DECEASED:
        // add condition for deceased cases
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // condition already include by default on cases list page
        // qb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // date
        if (globalFilters.date) {
          this.appliedListFilterQueryBuilder.filter.byDateRange(
            'dateOfOutcome', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // deceased
        this.appliedListFilterQueryBuilder.filter.where({
          outcomeId: Constants.OUTCOME_STATUS.DECEASED
        }, true);

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter cases hospitalised
      case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
        // add condition for deceased cases
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // condition already include by default on cases list page
        // qb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // get the correct query builder and merge with the existing one
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesHospitalized(globalFilters.date);
        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter cases hospitalised
      case Constants.APPLY_LIST_FILTER.CASES_DATE_RANGE_SUMMARY:
        // add condition for deceased cases
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // condition already include by default on cases list page
        // qb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // get the correct query builder and merge with the existing one
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        // get the number of contacts if it was updated
        this.appliedListFilterQueryBuilder.filter.where(
          {
            dateRanges: {
              elemMatch: {
                typeId: _.get(queryParams, 'x', null),
                $and: [
                  {
                    $or: [
                      {
                        startDate: {
                          $eq: null
                        }
                      }, {
                        startDate: {
                          $lte: moment(globalFilters.date).endOf('day').toISOString()
                        }
                      }
                    ]
                  }, {
                    $or: [
                      {
                        endDate: {
                          $eq: null
                        }
                      }, {
                        endDate: {
                          $gte: moment(globalFilters.date).startOf('day').toISOString()
                        }
                      }
                    ]
                  }
                ]
              }
            }
          },
          true
        );
        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // Filter contacts not seen
      case Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN:
        // get the number of days if it was updated
        const noDaysNotSeen = _.get(queryParams, 'x', null);
        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService
          .filterContactsNotSeen(
            globalFilters.date,
            globalFilters.locationId,
            globalFilters.classificationId,
            noDaysNotSeen
          )
          .subscribe((qbFilterContactsNotSeen) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterContactsNotSeen;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // filter cases with less than x contacts
      case Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS:
        // get the number of contacts if it was updated
        const noLessContacts = _.get(queryParams, 'x', null);

        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService
          .filterCasesLessThanContacts(
            globalFilters.date,
            globalFilters.locationId,
            globalFilters.classificationId,
            noLessContacts
          )
          .subscribe((qbFilterCasesLessThanContacts) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterCasesLessThanContacts;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // filter cases by classification criteria
      case Constants.APPLY_LIST_FILTER.CASE_SUMMARY:
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId
        );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // filter by classification
        const classificationCriteria = _.get(queryParams, 'x', null);

        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          // add and condition because otherwise classification filter if overwritten by the default one
          and: [
            classificationCriteria === 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_UNCLASSIFIED' ? {
              or: [
                {
                  classification: {
                    exists: false
                  }
                }, {
                  classification: {
                    type: 'null'
                  }
                }, {
                  classification: {
                    eq: ''
                  }
                }
              ]
            } : {
              classification: {
                eq: classificationCriteria
              }
            }
          ]
        }, true);

        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      case Constants.APPLY_LIST_FILTER.CASES_BY_LOCATION:
        // add condition for deceased cases
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();

        // construct query builder to filter by location
        const locationId = _.get(queryParams, 'locationId', null);
        const locationFilter: { [prop: string]: any }[] = [{
          addresses: {
            elemMatch: {
              typeId: AddressType.CURRENT_ADDRESS,
              parentLocationIdFilter: {
                // fix for not being consistent through the website, sometimes we use elemMatch other times $elemMatch which causes some issues on the api
                // if we want to fix this we need to change in many places, so this is an workaround
                $in: [locationId]
              }
            }
          }
        }];

        // global location
        // IMPORTANT - we need both the above one and this one to work properly, otherwise if you filter by location on dashboard might cause strange behaviour
        if (globalFilters.locationId) {
          locationFilter.push({
            'addresses.parentLocationIdFilter': globalFilters.locationId
          });
        }

        // append condition
        this.appliedListFilterQueryBuilder.filter.where({
          and: locationFilter
        });

        // date
        if (globalFilters.date) {
          this.appliedListFilterQueryBuilder.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // condition already include by default on cases list page
        // qb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // classification
        if (!_.isEmpty(globalFilters.classificationId)) {
          this.appliedListFilterQueryBuilder.filter.where({
            and: [{
              classification: {
                inq: globalFilters.classificationId
              }
            }]
          });
        }

        // main filters
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // Filter contacts lost to follow-up
      case Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP:
        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService.filterContactsLostToFollowUp(
          globalFilters.date,
          globalFilters.locationId,
          globalFilters.classificationId
        )
          .subscribe((qbFilterContactsLostToFollowUp) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterContactsLostToFollowUp;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // Filter cases in known transmission chains
      case Constants.APPLY_LIST_FILTER.CASES_IN_THE_TRANSMISSION_CHAINS:
        // get the number of days if it was updated
        const noDaysInChains = _.get(queryParams, 'x', null);
        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService.filterCasesInKnownChains(
          globalFilters.date,
          globalFilters.locationId,
          globalFilters.classificationId,
          noDaysInChains
        )
          .subscribe((qbFilterCasesInKnownChains) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterCasesInKnownChains;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // filter cases among contacts
      case Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS:
        // get the number of days  if it was updated
        const noDaysAmongContacts = _.get(queryParams, 'x', null);
        // get the correct query builder and merge with the existing one
        this.listHelperService.listFilterDataService.filterCasesAmongKnownContacts(
          globalFilters.date,
          globalFilters.locationId,
          globalFilters.classificationId,
          noDaysAmongContacts
        )
          .subscribe((qbFilterCasesAmongKnownContacts) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = qbFilterCasesAmongKnownContacts;
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // filter suspect cases with pending lab result
      case Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT:
        // add condition for deceased cases
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // condition already include by default on cases list page
        // globalQb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // get the correct query builder and merge with the existing one
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesPendingLabResult();
        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter suspect cases refusing treatment
      case Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT:
        // add condition for deceased cases
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // condition already include by default on cases list page
        // globalQb.filter.bySelect(
        //     'classification',
        //     this.globalFilterClassificationId,
        //     false,
        //     null
        // );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // get the correct query builder and merge with the existing one
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesRefusingTreatment();
        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter cases among contacts
      case Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
        // get the correct query builder and merge with the existing one
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterActiveChainsOfTransmission();

        // change the way we build query
        this.appliedListFilterQueryBuilder.filter.firstLevelConditions();

        // date
        if (globalFilters.date) {
          this.appliedListFilterQueryBuilder.filter.byDateRange(
            'contactDate', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // location
        if (globalFilters.locationId) {
          this.appliedListFilterQueryBuilder.addChildQueryBuilder('person').filter.where({
            or: [
              {
                type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                'address.parentLocationIdFilter': globalFilters.locationId
              }, {
                type: {
                  inq: [
                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                  ]
                },
                'addresses.parentLocationIdFilter': globalFilters.locationId
              }
            ]
          });
        }

        // classification
        if (!_.isEmpty(globalFilters.classificationId)) {
          // define classification conditions
          const classificationConditions = {
            or: [
              {
                type: {
                  neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                }
              }, {
                type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                classification: {
                  inq: globalFilters.classificationId
                }
              }
            ]
          };

          // top level classification
          this.appliedListFilterQueryBuilder.filter.where(classificationConditions);

          // person
          this.appliedListFilterQueryBuilder.addChildQueryBuilder('person').filter.where(classificationConditions);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter contacts becoming cases overtime and place
      case Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES:
        // add condition for deceased cases
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // date
        if (globalFilters.date) {
          this.appliedListFilterQueryBuilder.filter.byDateRange(
            'dateBecomeCase', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // do we need to include default condition ?
        if (!this.appliedListFilterQueryBuilder.filter.has('dateBecomeCase')) {
          // any date
          this.appliedListFilterQueryBuilder.filter.where({
            'dateBecomeCase': {
              neq: null
            }
          });
        }

        // exclude discarded cases
        this.appliedListFilterQueryBuilder.filter.where({
          classification: {
            neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
          }
        });

        // include was contact cases
        this.appliedListFilterQueryBuilder.filter.byBoolean(
          'wasContact',
          true
        );

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // refresh list on query params changes ( example browser back button was pressed )
      case Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
        // no extra filter
        this.appliedListFilterQueryBuilder = null;
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter cases without relationships
      case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS:
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesWithoutRelationships();
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // filter events without relationships
      case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS:
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterEventsWithoutRelationships();
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // Filter contacts seen
      case Constants.APPLY_LIST_FILTER.CONTACTS_SEEN:
        this.listHelperService.listFilterDataService.filterContactsSeen(
          globalFilters.date,
          globalFilters.locationId,
          globalFilters.classificationId
        )
          .subscribe((result: MetricContactsSeenEachDays) => {
            // merge query builder
            this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
            this.appliedListFilterQueryBuilder.filter.where({
              id: {
                'inq': result.contactIDs
              }
            }, true);
            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // Filter contacts witch successful follow-up
      case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP:
        this.listHelperService.listFilterDataService
          .filterContactsWithSuccessfulFollowup(
            globalFilters.date,
            globalFilters.locationId,
            globalFilters.classificationId
          )
          .subscribe((result: MetricContactsWithSuccessfulFollowUp) => {
            const contactIDs: string[] = _.chain(result.contacts)
              .filter((item: ContactFollowedUp) => item.successfulFollowupsCount > 0)
              .map((item: ContactFollowedUp) => {
                return item.id;
              }).value();
            // merge query builder
            this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
            this.appliedListFilterQueryBuilder.filter.where({
              id: {
                'inq': contactIDs
              }
            }, true);

            this.mergeListFilterToMainFilter();

            // refresh list
            this.refreshCallback(true);
          });
        break;

      // Filter cases without date of onset.
      case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN:
        // get the case ids that need to be updated
        const caseIds = _.get(queryParams, 'caseIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(caseIds) ? caseIds : [caseIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter cases without date of last contact
      case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN:
        // get the case ids that need to be updated
        const caseLCIds = _.get(queryParams, 'caseIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(caseLCIds) ? caseLCIds : [caseLCIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter cases without date of reporting
      case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_REPORTING_CHAIN:
        // get the case ids that need to be updated
        const caseDRIds = _.get(queryParams, 'caseIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(caseDRIds) ? caseDRIds : [caseDRIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter contacts without date of last contact.
      case Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN:
        // get the contact ids that need to be updated
        const contactIds = _.get(queryParams, 'contactIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(contactIds) ? contactIds : [contactIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter contacts without date of last contact.
      case Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN:
        // get the contact ids that need to be updated
        const contactDRIds = _.get(queryParams, 'contactIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(contactDRIds) ? contactDRIds : [contactDRIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter events without date
      case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN:
        // get the event ids that need to be updated
        const eventIds = _.get(queryParams, 'eventIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(eventIds) ? eventIds : [eventIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter events without date
      case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN:
        // get the event ids that need to be updated
        const eventDRIds = _.get(queryParams, 'eventIds', null);
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': Array.isArray(eventDRIds) ? eventDRIds : [eventDRIds]
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

      // Filter cases who are not identified though known contact list
      case Constants.APPLY_LIST_FILTER.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS:
        // add condition for deceased cases
        globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
          null,
          null,
          'addresses.parentLocationIdFilter',
          globalFilters.locationId,
          globalFilters.classificationId
        );

        // date
        if (globalFilters.date) {
          globalQb.filter.byDateRange(
            'dateOfReporting', {
              endDate: globalFilters.date.endOf('day').format()
            }
          );
        }

        // get the correct query builder and merge with the existing one
        // includes
        // classification: {
        //     neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
        // }
        this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesNotIdentifiedThroughContacts();
        if (!globalQb.isEmpty()) {
          this.appliedListFilterQueryBuilder.merge(globalQb);
        }

        // merge query builder
        this.mergeListFilterToMainFilter();

        // refresh list
        this.refreshCallback(true);
        break;

      // Filter context sensitive help items
      case Constants.APPLY_LIST_FILTER.CONTEXT_SENSITIVE_HELP_ITEMS:
        // get the help items ids that need to be updated
        const helpItemsIds = _.get(queryParams, 'helpItemsIds', null);
        const itemsIds: string[] = (_.isArray(helpItemsIds) ?
          helpItemsIds :
          [helpItemsIds]
        ) as string[];
        // get the correct query builder and merge with the existing one
        // merge query builder
        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
        this.appliedListFilterQueryBuilder.filter.where({
          id: {
            'inq': itemsIds
          }
        }, true);
        this.mergeListFilterToMainFilter();
        // refresh list
        this.refreshCallback(true);
        break;

    }
  }

  /**
   * Stop timer
   */
  private stopApplyListFiltersTimer(): void {
    if (this._applyListFiltersTimer) {
      clearTimeout(this._applyListFiltersTimer);
      this._applyListFiltersTimer = undefined;
    }
  }

  /**
   * Check if list filter applies
   */
  protected checkListFilters() {
    // retrieve query params
    const queryParams: any = this.listHelperService.route.snapshot.queryParams;

    // reset values
    this.appliedListFilter = queryParams && queryParams.applyListFilter ? queryParams.applyListFilter : null;
    this.appliedListFilterQueryBuilder = null;

    // do we need to wait for list filter to be initialized ?
    this.appliedListFilterLoading = !_.isEmpty(this.appliedListFilter);

    // stop previous
    this.stopApplyListFiltersTimer();

    // wait for component initialization, since this method is called from constructor
    this._applyListFiltersTimer = setTimeout(() => {
      // reset
      this._applyListFiltersTimer = undefined;

      // do we have query params to apply ?
      if (_.isEmpty(queryParams)) {
        return;
      }

      // call function to apply filters - update query builder
      this.applyListFilters(queryParams);
    });
  }
}
