import * as _ from 'lodash';

export class RequestQueryBuilder {

    // Relations to include
    public includedRelations: any[] = [];
    // Where conditions
    public whereCondition: any = {};
    // Limit
    public limitResultsNumber: number;
    // Fields to retrieve
    public fieldsInResponse: string[] = [];

    /**
     * Adds a "where" condition
     * Note: conditions on the same property are overwritten by the last "where" clause added
     * @param condition Loopback condition on a property
     * @returns {this}
     */
    where(condition: any) {
        this.whereCondition = {...this.whereCondition, ...condition};

        return this;
    }

    /**
     * Remove specific condition
     * @param {string} property
     * @returns {this}
     */
    whereRemove(property: string) {
        delete this.whereCondition[property];

        return this;
    }

    /**
     * Remove all filters
     * @returns {this}
     */
    clear() {
        // remove conditions - same as this.whereCondition = [], but this method will keep the same object in case we're binding it
        for (const p in this.whereCondition) {
            delete this.whereCondition[p];
        }

        // finished
        return this;
    }

    /**
     * Sets a "limit" on the number of results retrieved in a list
     * @param {number} limit
     */
    limit(limit: number) {
        this.limitResultsNumber = limit;
    }

    /**
     * Include one or many relations
     * @param {string|any} relations
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
     */
    fields(...fields: string[]) {
        this.fieldsInResponse = _.uniq([...this.fieldsInResponse, ...fields]);
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

        if (Object.keys(this.whereCondition).length > 0) {
            filter.where = this.whereCondition;
        }

        if (this.limitResultsNumber) {
            filter.limit = this.limitResultsNumber;
        }

        return JSON.stringify(filter);
    }

    /**
     * Merge current Query Builder with a new one.
     * Note: The new Query Builder will overwrite the properties of the current one
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {this}
     */
    merge(queryBuilder: RequestQueryBuilder) {
        // merge includes
        this.include(...queryBuilder.includedRelations);

        // merge fields
        this.fields(...queryBuilder.fieldsInResponse);

        // merge "where" conditions
        this.whereCondition = {...this.whereCondition, ...queryBuilder.whereCondition};

        // update the "limit" if necessary
        this.limitResultsNumber = queryBuilder.limitResultsNumber || this.limitResultsNumber;

        return this;
    }
}

