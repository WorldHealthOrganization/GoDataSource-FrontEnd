import * as _ from 'lodash';

export class RequestQueryBuilder {

    // Relations to include
    public includedRelations: any[] = [];
    // Where conditions
    public whereCondition: any = {};
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

        return this;
    }
}

