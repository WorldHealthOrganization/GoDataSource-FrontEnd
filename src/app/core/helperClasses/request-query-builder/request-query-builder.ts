import * as _ from 'lodash';
import { RequestFilter } from './request-filter';
import { RequestSort } from './request-sort';
import { RequestPaginator } from './request-paginator';

export class RequestQueryBuilder {
    // Relations to include
    public includedRelations: {
        [relationName: string]: RequestRelationBuilder
    } = {};
    // Where conditions
    public filter: RequestFilter = new RequestFilter();
    // Order fields
    public sort: RequestSort = new RequestSort();
    // Paginator
    public paginator: RequestPaginator = new RequestPaginator();
    // Return deleted records ?
    private deleted: boolean = false;
    // include deleted records flag to set it on the filter first level to include all records
    private _includeDeletedRecords: boolean = false;
    set includeDeletedRecords(value: boolean) {
        this._includeDeletedRecords = value;
    }
    get includeDeletedRecords(): boolean {
        return this._includeDeletedRecords;
    }
    // Limit
    public limitResultsNumber: number;
    // Fields to retrieve
    public fieldsInResponse: string[] = [];
    // other custom query full query builders
    public childrenQueryBuilders: {
        [qbFilterKey: string]: RequestQueryBuilder
    } = {};

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
     * @param {boolean} needsIncludeData Set this to true in case you want to keep data ( it is enough to have just one include for the same relation that need to keep data )
     * @returns {RequestRelationBuilder}
     */
    include(
        relationName: string,
        needsIncludeData: boolean = false
    ): RequestRelationBuilder {
        if (!this.includedRelations[relationName]) {
            // add new relation
            // tslint:disable-next-line:no-use-before-declare
            this.includedRelations[relationName] = new RequestRelationBuilder(relationName);
        }

        // do we need to keep data ?
        if (needsIncludeData) {
            this.includedRelations[relationName].justFilter = false;
        } else {
            // OTHERWISE let it how it was..don't change it to true...
        }

        // finished
        return this.includedRelations[relationName];
    }

    /**
     * Remove relation
     * @param relationName
     */
    removeRelation(relationName: string) {
        delete this.includedRelations[relationName];
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
     * Remove child query builder
     * @param qbFilterKey
     */
    removeChildQueryBuilder(qbFilterKey: string) {
        delete this.childrenQueryBuilders[qbFilterKey];
    }

    /**
     * Add new child query builder
     */
    addChildQueryBuilder(
        qbFilterKey: string,
        replace: boolean = false
    ): RequestQueryBuilder {
        // replace ?
        if (replace) {
            this.removeChildQueryBuilder(qbFilterKey);
        }

        // add query builder
        if (this.childrenQueryBuilders[qbFilterKey] === undefined) {
            this.childrenQueryBuilders[qbFilterKey] = new RequestQueryBuilder();
        }

        // finished
        return this.childrenQueryBuilders[qbFilterKey];
    }

    /**
     * Check if all child query builders are empty
     */
    allChildQueryBuildersAreEmpty(): boolean {
        let isEmpty: boolean = true;
        _.each(this.childrenQueryBuilders, (qb: RequestQueryBuilder) => {
            if (!qb.isEmpty()) {
                isEmpty = false;
                return false;
            }
        });
        return isEmpty;
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

        // add other custom filters
        if (!_.isEmpty(this.childrenQueryBuilders)) {
            _.each(this.childrenQueryBuilders, (qb: RequestQueryBuilder, qbKey: string) => {
                if (!qb.isEmpty()) {
                    _.set(
                        filter,
                        `[where][${qbKey}]`,
                        qb.filter.generateCondition()
                    );
                }
            });
        }

        // serve
        return stringified ? JSON.stringify(filter) : filter;
    }

    /**
     * Merge current Query Builder with a new one.
     * Note: 'AND' operator will be applied between the conditions of the two Query Builders
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {RequestQueryBuilder}
     */
    merge(queryBuilder: RequestQueryBuilder) {
        // merge includes keeping in mind that some of their properties need to remain how they were set previously
        _.each(queryBuilder.includedRelations, (requestRelationBuilder: RequestRelationBuilder, relationName: string) => {
            // add relation if necessary so we don't modify the input
            if (this.includedRelations[relationName] === undefined) {
                this.includedRelations[relationName] = _.cloneDeep(queryBuilder.includedRelations[relationName]);
            } else {
                // merge data
                this.includedRelations[relationName].merge(requestRelationBuilder);
            }
        });

        // merge fields
        this.fields(...queryBuilder.fieldsInResponse);

        // merge "where" conditions
        if (this.filter.isEmpty()) {
            // use the other filter
            this.filter = queryBuilder.filter;
        } else if (queryBuilder.filter.isEmpty()) {
            // do nothing; there is no filter to merge with
        } else {
            // merge conditions - New
            const newWhere = queryBuilder.filter.generateCondition(false, true);
            if (!_.isEmpty(newWhere)) {
                this.filter.where(newWhere);
            }

            // merge flags - New
            const newFlags = queryBuilder.filter.getFlags();
            if (!_.isEmpty(newFlags)) {
                _.each(newFlags, (flagData: any, flagKey: string) => {
                    this.filter.flag(flagKey, flagData);
                });
            }
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

        // merge custom filters
        if (!_.isEmpty(queryBuilder.childrenQueryBuilders)) {
            this.childrenQueryBuilders = {
                ...this.childrenQueryBuilders,
                ...queryBuilder.childrenQueryBuilders
            };
        }

        // serve
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
            _.isEmpty(this.fieldsInResponse) &&
            this.allChildQueryBuildersAreEmpty();
    }

    /**
     * Check if any of this query builder filters have conditions
     */
    doAnyOfTheFiltersHaveConditions(): boolean {
        // check main filter & included filters
        const includeCheck = (qb: RequestQueryBuilder): boolean => {
            // check the main filter
            if (!qb.filter.isEmpty()) {
                return true;
            }

            // check include
            let relName: string;
            for (relName in qb.includedRelations) {
                const qbChild: RequestRelationBuilder = qb.includedRelations[relName];
                if (includeCheck(qbChild.queryBuilder)) {
                    return true;
                }
            }
        };

        // check
        return includeCheck(this);
    }

    /**
     * Clear children query builders
     */
    clearChildrenQueryBuilders() {
        this.childrenQueryBuilders = {};
    }

    /**
     * Clear filter and sort criterias
     */
    clear() {
        this.filter.clear();
        this.includedRelations = {};
        this.sort.clear();
        this.clearChildrenQueryBuilders();
        this.deleted = false;
    }
}

export class RequestRelationBuilder {
    public filterParent: boolean = true;
    public justFilter: boolean = true;

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
                filterParent: this.queryBuilder.doAnyOfTheFiltersHaveConditions() ? this.filterParent : false,
                justFilter: this.justFilter
            }
        };
    }

    /**
     * Merge two request relation builders
     * @param requestRelationBuilder
     */
    merge(requestRelationBuilder: RequestRelationBuilder) {
        // can merge ?
        if (this.name !== requestRelationBuilder.name) {
            return;
        }

        // set flags
        this.justFilter = this.justFilter ? requestRelationBuilder.justFilter : false;
        this.filterParent = this.filterParent ? true : requestRelationBuilder.filterParent;

        // merge query builders
        this.queryBuilder.merge(requestRelationBuilder.queryBuilder);
    }
}
