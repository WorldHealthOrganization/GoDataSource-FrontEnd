import * as _ from 'lodash';
import { ISerializedQueryFilter, RequestFilter } from './request-filter';
import { ISerializedQuerySort, RequestSort } from './request-sort';
import { ISerializedQueryPaginator, RequestPaginator } from './request-paginator';

/**
 * Serialized
 */
export interface ISerializedQueryBuilder {
    filter: ISerializedQueryFilter;
    sort: ISerializedQuerySort;
    paginator: ISerializedQueryPaginator;
    deleted: boolean;
    limitResultsNumber: number;
    fieldsInResponse: string[];
    includedRelations: {
        [relationName: string]: ISerializedQueryBuilderRelation
    };
    childrenQueryBuilders: {
        [qbFilterKey: string]: ISerializedQueryBuilder
    };
}

/**
 * Serialized
 */
export interface ISerializedQueryBuilderRelation {
    name: string;
    filterParent: boolean;
    justFilter: boolean;
    queryBuilder: ISerializedQueryBuilder;
}

/**
 * Query builder
 */
export class RequestQueryBuilder {
    // Relations to include
    public includedRelations: {
        [relationName: string]: RequestRelationBuilder
    } = {};

    // Where conditions
    public filter: RequestFilter = new RequestFilter(() => {
        // trigger change
        this.triggerChangeListener();
    });

    // Order fields
    public sort: RequestSort = new RequestSort(() => {
        // trigger change
        this.triggerChangeListener();
    });

    // Paginator
    public paginator: RequestPaginator = new RequestPaginator(() => {
        // trigger change
        this.triggerChangeListener();
    });

    // Return deleted records ?
    private deleted: boolean = false;

    // Limit
    public limitResultsNumber: number;

    // Fields to retrieve
    private fieldsInResponse: string[] = [];

    // other custom query full query builders
    public childrenQueryBuilders: {
        [qbFilterKey: string]: RequestQueryBuilder
    } = {};

    // changes listener
    private changesListener: () => void;

    /**
     * Constructor
     */
    constructor(listener?: () => void) {
        this.changesListener = listener;
    }

    /**
     * Trigger change listener
     */
    private triggerChangeListener(): void {
        // do we have a change listener ?
        if (!this.changesListener) {
            return;
        }

        // trigger change
        this.changesListener();
    }

    /**
     * #TODO Replace usage with RequestPaginator
     * Sets a "limit" on the number of results retrieved in a list
     * @param {number} limit
     * @returns {RequestQueryBuilder}
     */
    limit(limit: number) {
        // limit
        this.limitResultsNumber = limit;

        // trigger change
        this.triggerChangeListener();

        // finished
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
            this.includedRelations[relationName] = new RequestRelationBuilder(
                relationName,
                () => {
                    // trigger change
                    this.triggerChangeListener();
                }
            );
        }

        // do we need to keep data ?
        if (needsIncludeData) {
            this.includedRelations[relationName].justFilter = false;
        } else {
            // OTHERWISE let it how it was..don't change it to true...
        }

        // trigger change
        this.triggerChangeListener();

        // finished
        return this.includedRelations[relationName];
    }

    /**
     * Remove relation
     * @param relationName
     */
    removeRelation(relationName: string) {
        // delete
        delete this.includedRelations[relationName];

        // trigger change
        this.triggerChangeListener();
    }

    /**
     * Include fields to be retrieved in response
     * @param {string} fields
     * @returns {RequestQueryBuilder}
     */
    fields(...fields: string[]) {
        // projection
        this.fieldsInResponse = _.uniq([...this.fieldsInResponse, ...fields]);

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Include deleted records
     * @returns {RequestQueryBuilder}
     */
    includeDeleted() {
        // delete ?
        this.deleted = true;

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Exclude deleted records ( this is the default behaviour )
     * @returns {RequestQueryBuilder}
     */
    excludeDeleted() {
        // delete ?
        this.deleted = false;

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Check if deleted is enabled
     */
    isDeletedEnabled(): boolean {
        return this.deleted;
    }

    /**
     * Remove child query builder
     * @param qbFilterKey
     */
    removeChildQueryBuilder(qbFilterKey: string) {
        // delete
        delete this.childrenQueryBuilders[qbFilterKey];

        // trigger change
        this.triggerChangeListener();
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
            this.childrenQueryBuilders[qbFilterKey] = new RequestQueryBuilder(() => {
                // trigger change
                this.triggerChangeListener();
            });
        }

        // trigger change
        this.triggerChangeListener();

        // finished
        return this.childrenQueryBuilders[qbFilterKey];
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

        // trigger change
        this.triggerChangeListener();

        // serve
        return this;
    }

    /**
     * Check if the query builder is empty
     * @returns {boolean}
     */
    isEmpty(): boolean {
        // check if all child query builders are empty
        let isEmptyChildrenBuilders: boolean = true;
        _.each(this.childrenQueryBuilders, (qb: RequestQueryBuilder) => {
            if (!qb.isEmpty()) {
                isEmptyChildrenBuilders = false;
                return false;
            }
        });

        // empty ?
        return _.isEmpty(this.includedRelations) &&
            this.filter.isEmpty() &&
            this.sort.isEmpty() &&
            _.isEmpty(this.limitResultsNumber) &&
            this.paginator.isEmpty() &&
            _.isEmpty(this.fieldsInResponse) &&
            isEmptyChildrenBuilders;
    }

    /**
     * Check if filters are empty
     */
    isEmptyOnlyFilters(): boolean {
        // check if all child query builders are empty
        let isEmptyChildrenBuilders: boolean = true;
        _.each(this.childrenQueryBuilders, (qb: RequestQueryBuilder) => {
            if (!qb.isEmptyOnlyFilters()) {
                isEmptyChildrenBuilders = false;
                return false;
            }
        });

        // include relationships
        let isEmptyIncludeRelationships: boolean = true;
        _.each(this.includedRelations, (rrb: RequestRelationBuilder) => {
            if (!rrb.queryBuilder.isEmptyOnlyFilters()) {
                isEmptyIncludeRelationships = false;
                return false;
            }
        });

        // empty filters ?
        return this.filter.isEmpty() &&
            isEmptyChildrenBuilders &&
            isEmptyIncludeRelationships;
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
        // clear
        this.childrenQueryBuilders = {};

        // trigger change
        this.triggerChangeListener();
    }

    /**
     * Clear filter and sort criterias
     */
    clear() {
        // clear
        this.filter.clear();
        this.includedRelations = {};
        this.sort.clear();
        this.clearChildrenQueryBuilders();
        this.deleted = false;

        // trigger change
        this.triggerChangeListener();
    }

    /**
     * Serialize query builder
     */
    serialize(): ISerializedQueryBuilder {
        return {
            filter: this.filter.serialize(),
            sort: this.sort.serialize(),
            paginator: this.paginator.serialize(),
            deleted: this.deleted,
            limitResultsNumber: this.limitResultsNumber,
            fieldsInResponse: this.fieldsInResponse,
            includedRelations: _.transform(
                this.includedRelations,
                (result: {[relationName: string]: ISerializedQueryBuilderRelation}, value: RequestRelationBuilder, key: string) => {
                    result[key] = value.serialize();
                },
                {}
            ),
            childrenQueryBuilders: _.transform(
                this.childrenQueryBuilders,
                (result: {[qbFilterKey: string]: ISerializedQueryBuilder}, value: RequestQueryBuilder, key: string) => {
                    result[key] = value.serialize();
                },
                {}
            )
        };
    }

    /**
     * Replace query builder filters with saved ones
     */
    deserialize(
        serializedValue: string | ISerializedQueryBuilder
    ): void {
        // deserialize
        const serializedValueObject: ISerializedQueryBuilder = _.isString(serializedValue) ?
            JSON.parse(serializedValue) :
            serializedValue as ISerializedQueryBuilder;

        // deserialize
        this.filter.deserialize(serializedValueObject.filter);
        this.sort.deserialize(serializedValueObject.sort);
        this.paginator.deserialize(serializedValueObject.paginator);
        this.deleted = serializedValueObject.deleted;
        this.limitResultsNumber = serializedValueObject.limitResultsNumber;
        this.fieldsInResponse = serializedValueObject.fieldsInResponse;
        this.includedRelations = _.transform(
            serializedValueObject.includedRelations,
            (result: {[relationName: string]: RequestRelationBuilder}, value: ISerializedQueryBuilderRelation, key: string) => {
                // create new relationship if necessary
                // tslint:disable-next-line:no-use-before-declare
                result[key] = new RequestRelationBuilder(
                    key,
                    () => {
                        // trigger change
                        this.triggerChangeListener();
                    }
                );

                // load data from cache into it
                result[key].deserialize(value);
            },
            {}
        );
        this.childrenQueryBuilders = _.transform(
            serializedValueObject.childrenQueryBuilders,
            (result: {[qbFilterKey: string]: RequestQueryBuilder}, value: ISerializedQueryBuilder, key: string) => {
                // create new relationship if necessary
                result[key] = new RequestQueryBuilder(
                    () => {
                        // trigger change
                        this.triggerChangeListener();
                    }
                );

                // load data from cache into it
                result[key].deserialize(value);
            },
            {}
        );
    }
}

/**
 * Relation builder
 */
export class RequestRelationBuilder {
    // relation data
    public filterParent: boolean = true;
    public justFilter: boolean = true;

    // query builder to be applied on the relation
    queryBuilder: RequestQueryBuilder;

    // changes listener
    private changesListener: () => void;

    /**
     * Constructor
     */
    constructor(
        // relation name
        public name: string,

        // changes listener
        listener?: () => void
    ) {
        // set listener
        this.changesListener = listener;

        // initialize query builder if necessary
        this.queryBuilder = new RequestQueryBuilder(() => {
            // trigger change
            this.triggerChangeListener();
        });
    }

    /**
     * Trigger change listener
     */
    private triggerChangeListener(): void {
        // do we have a change listener ?
        if (!this.changesListener) {
            return;
        }

        // trigger change
        this.changesListener();
    }

    /**
     * Generates a new "include" criteria for Loopback API
     */
    buildRelation(): {
        relation: string,
        scope: any
    } {
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

        // trigger change
        this.triggerChangeListener();
    }

    /**
     * Serialize query builder
     */
    serialize(): ISerializedQueryBuilderRelation {
        return {
            name: this.name,
            filterParent: this.filterParent,
            justFilter: this.justFilter,
            queryBuilder: this.queryBuilder.serialize()
        };
    }

    /**
     * Replace query builder filters with saved ones
     */
    deserialize(
        serializedValue: string | ISerializedQueryBuilderRelation
    ): void {
        // deserialize
        const serializedValueObject: ISerializedQueryBuilderRelation = _.isString(serializedValue) ?
            JSON.parse(serializedValue) :
            serializedValue as ISerializedQueryBuilderRelation;

        // update data
        this.name = serializedValueObject.name;
        this.filterParent = serializedValueObject.filterParent;
        this.justFilter = serializedValueObject.justFilter;
        this.queryBuilder.deserialize(serializedValueObject.queryBuilder);
    }
}
