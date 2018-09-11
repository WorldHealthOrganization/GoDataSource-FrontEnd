import * as _ from 'lodash';
import { RequestFilter } from './request-filter';
import { RequestSort } from './request-sort';
import { RequestPaginator } from './request-paginator';

export class RequestQueryBuilder {
    // Relations to include
    public includedRelations: any = {};
    // Where conditions
    public filter: RequestFilter = new RequestFilter();
    // Order fields
    public sort: RequestSort = new RequestSort();
    // Paginator
    public paginator: RequestPaginator = new RequestPaginator();
    // Return deleted records ?
    private deleted: boolean = false;
    // Limit
    public limitResultsNumber: number;
    // Fields to retrieve
    public fieldsInResponse: string[] = [];

    /**
     * #TODO Replace usage with RequestPaginator
     * Sets a "limit" on the number of results retrieved in a list
     * @param {number} limit
     * @returns {RequestQueryBuilder}
     */
    limit(limit: number) {
        this.limitResultsNumber = limit;

        return this;
    }

    /**
     * Include a relation
     * @param {string} relationName
     * @returns {RequestRelationBuilder}
     */
    include(relationName: string): RequestRelationBuilder {
        // check if relation already exists
        const relation: RequestRelationBuilder = this.includedRelations[relationName];

        if (relation) {
            return relation;
        } else {
            // add new relation
            // tslint:disable-next-line:no-use-before-declare
            this.includedRelations[relationName] = new RequestRelationBuilder(relationName);

            return this.includedRelations[relationName];
        }
    }

    /**
     * Include fields to be retrieved in response
     * @param {string} fields
     * @returns {RequestQueryBuilder}
     */
    fields(...fields: string[]) {
        this.fieldsInResponse = _.uniq([...this.fieldsInResponse, ...fields]);

        return this;
    }

    /**
     * Include deleted records
     * @returns {RequestQueryBuilder}
     */
    includeDeleted() {
        this.deleted = true;
        return this;
    }

    /**
     * Exclude deleted records ( this is the default behaviour )
     * @returns {RequestQueryBuilder}
     */
    excludeDeleted() {
        this.deleted = false;
        return this;
    }

    /**
     * Build the query to be applied on Loopback requests
     * @returns {string}
     */
    buildQuery(stringified: boolean = true) {
        const filter: any = {};

        // add "where" conditions
        if (!this.filter.isEmpty()) {
            filter.where = this.filter.generateCondition();
        }

        // get included relations
        const relations: RequestRelationBuilder[] = Object.values(this.includedRelations);
        if (relations.length > 0) {
            filter.include = _.map(relations, (relation: RequestRelationBuilder) => {
                return relation.buildRelation();
            });
        }

        // set fields to be included in response
        if (this.fieldsInResponse.length > 0) {
            filter.fields = this.fieldsInResponse;
        }

        // set sorting criterias
        if (!this.sort.isEmpty()) {
            filter.order = this.sort.generateCriteria();
        }

        // limit number of results
        if (this.limitResultsNumber) {
            filter.limit = this.limitResultsNumber;
        }

        // apply pagination criterias
        if (!this.paginator.isEmpty()) {
            filter.limit = this.paginator.limit;
            filter.skip = this.paginator.skip;
        }

        // retrieve deleted entries?
        if (this.deleted) {
            filter.deleted = true;
        }

        return stringified ? JSON.stringify(filter) : filter;
    }

    /**
     * Merge current Query Builder with a new one.
     * Note: 'AND' operator will be applied between the conditions of the two Query Builders
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {RequestQueryBuilder}
     */
    merge(queryBuilder: RequestQueryBuilder) {
        // merge includes
        this.includedRelations = {...this.includedRelations, ...queryBuilder.includedRelations};

        // merge fields
        this.fields(...queryBuilder.fieldsInResponse);

        // merge "where" conditions
        if (this.filter.isEmpty()) {
            // use the other filter
            this.filter = queryBuilder.filter;
        } else if (queryBuilder.filter.isEmpty()) {
            // do nothing; there is no filter to merge with
        } else {
            // merge the two filters
            const mergedFilter = new RequestFilter();
            mergedFilter.where(this.filter.generateCondition());
            mergedFilter.where(queryBuilder.filter.generateCondition());
            this.filter = mergedFilter;
        }

        // merge "order" criterias
        this.sort.criterias = {...this.sort.criterias, ...queryBuilder.sort.criterias};

        // update the "limit" if necessary
        this.limitResultsNumber = queryBuilder.limitResultsNumber || this.limitResultsNumber;

        // apply pagination criterias
        if (!queryBuilder.paginator.isEmpty()) {
            this.paginator.limit = queryBuilder.paginator.limit;
            this.paginator.skip = queryBuilder.paginator.skip;
        }

        // merge deleted
        this.deleted = queryBuilder.deleted;

        return this;
    }

    /**
     * Check if the query builder is empty
     * @returns {boolean}
     */
    isEmpty(): boolean {
        return _.isEmpty(this.includedRelations) &&
            this.filter.isEmpty() &&
            this.sort.isEmpty() &&
            _.isEmpty(this.limitResultsNumber) &&
            this.paginator.isEmpty() &&
            _.isEmpty(this.fieldsInResponse);
    }

    /**
     * Clear filter and sort criterias
     */
    clear() {
        this.filter.clear();
        this.includedRelations = {};
        this.sort.clear();
        this.deleted = false;
    }
}

export class RequestRelationBuilder {
    public filterParent: boolean = true;

    constructor(
        // relation name
        public name: string,
        // query builder to be applied on the relation
        public queryBuilder?: RequestQueryBuilder
    ) {
        if (!this.queryBuilder) {
            this.queryBuilder = new RequestQueryBuilder();
        }
    }

    /**
     * Generates a new "include" criteria for Loopback API
     * @returns {{}}
     */
    buildRelation() {
        return {
            relation: this.name,
            scope: {
                ...this.queryBuilder.buildQuery(false),
                filterParent: this.filterParent
            }
        };
    }
}
