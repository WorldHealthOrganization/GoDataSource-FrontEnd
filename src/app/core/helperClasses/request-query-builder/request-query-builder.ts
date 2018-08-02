import * as _ from 'lodash';
import { RequestFilter } from './request-filter';
import { RequestSort } from './request-sort';

export class RequestQueryBuilder {
    // Relations to include
    public includedRelations: any = {};
    // Where conditions
    public filter: RequestFilter = new RequestFilter();
    // Order fields
    public sort: RequestSort = new RequestSort();
    // Return deleted records ?
    private deleted: boolean = false;
    // Limit
    public limitResultsNumber: number;
    // Fields to retrieve
    public fieldsInResponse: string[] = [];

    /**
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

        if (this.fieldsInResponse.length > 0) {
            filter.fields = this.fieldsInResponse;
        }

        if (!this.sort.isEmpty()) {
            filter.order = this.sort.generateCriteria();
        }

        if (this.limitResultsNumber) {
            filter.limit = this.limitResultsNumber;
        }

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
            _.isEmpty(this.fieldsInResponse);
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
