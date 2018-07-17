import * as _ from 'lodash';
import { RequestFilter } from './request-filter';
import { RequestSort } from './request-sort';

export class RequestQueryBuilder {
    // Relations to include
    public includedRelations: any[] = [];
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
     * Include one or many relations
     * @param {string|any} relations
     * @returns {RequestQueryBuilder}
     */
    include(...relations: any[]) {
        // keep all relations as objects
        relations = _.map(relations, (relation) => {
            return _.isString(relation) ? {relation: relation} : relation;
        });

        // overwrite relations that are already included
        this.includedRelations = _.filter(this.includedRelations, (includedRelation) => {
            // remove already included relations that are going to be overwritten
            return !_.find(relations, (relation) => {
                return includedRelation.relation === relation.relation;
            });
        });

        this.includedRelations = [...this.includedRelations, ...relations];

        return this;
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
     * @returns {this}
     */
    includeDeleted() {
        this.deleted = true;
        return this;
    }

    /**
     * Exclude deleted records ( this is the default behaviour )
     * @returns {this}
     */
    excludeDeleted() {
        this.deleted = false;
        return this;
    }

    /**
     * Build the query to be applied on Loopback requests
     * @returns {string}
     */
    buildQuery() {
        const filter: any = {};

        if (this.includedRelations.length > 0) {
            filter.include = this.includedRelations;
        }

        if (this.fieldsInResponse.length > 0) {
            filter.fields = this.fieldsInResponse;
        }

        if (!this.filter.isEmpty()) {
            filter.where = this.filter.generateCondition();
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

        return JSON.stringify(filter);
    }

    /**
     * Merge current Query Builder with a new one.
     * Note: 'AND' operator will be applied between the conditions of the two Query Builders
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {RequestQueryBuilder}
     */
    merge(queryBuilder: RequestQueryBuilder) {
        // merge includes
        this.include(...queryBuilder.includedRelations);

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
     */
    isEmpty(): boolean {
        return _.isEmpty(this.includedRelations) &&
            this.filter.isEmpty() &&
            this.sort.isEmpty() &&
            _.isEmpty(this.limitResultsNumber) &&
            _.isEmpty(this.fieldsInResponse);
    }
}

