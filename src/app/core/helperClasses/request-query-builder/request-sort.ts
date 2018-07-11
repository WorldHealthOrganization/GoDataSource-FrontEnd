import * as _ from 'lodash';

export enum RequestSortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

export class RequestSort {
    // criterias to sort by
    public criterias = {};

    /**
     * Adds a "sort" criteria
     * Note: If there is already another criteria on the same property, it will be replaced
     * @param property
     * @param direction
     * @returns {RequestSort}
     */
    by(property: string, direction: RequestSortDirection = RequestSortDirection.ASC) {
        this.criterias[property] = direction;

        return this;
    }

    /**
     * Remove criteria applied on a specific property
     * @param {string} property
     * @returns {RequestSort}
     */
    remove(property: string) {
        delete this.criterias[property];

        return this;
    }

    /**
     * Remove all criterias
     * @returns {RequestSort}
     */
    clear() {
        this.criterias = {};

        return this;
    }

    /**
     * Check if there are any criterias set
     * @returns {boolean}
     */
    isEmpty() {
        return Object.keys(this.criterias).length === 0;
    }

    /**
     * Generates a new "order" criteria for Loopback API
     * @returns {{}}
     */
    generateCriteria() {
        return this.isEmpty() ?
            [] :
            _.map(this.criterias, (direction, property) => {
                return `${property} ${direction}`;
            });
    }
}
