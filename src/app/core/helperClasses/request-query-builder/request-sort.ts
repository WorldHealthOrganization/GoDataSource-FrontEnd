import * as _ from 'lodash';

export enum RequestSortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

/**
 * Serialized
 */
export interface ISerializedQuerySort {
    criterias: any;
}

/**
 * Sort
 */
export class RequestSort {
    // criterias to sort by
    public criterias = {};

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
     * Adds a "sort" criteria
     * Note: If there is already another criteria on the same property, it will be replaced
     * @param property
     * @param direction
     * @returns {RequestSort}
     */
    by(
        property: string,
        direction: RequestSortDirection = RequestSortDirection.ASC
    ): RequestSort {
        // add sorting criteria
        this.criterias[property] = direction;

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Remove criteria applied on a specific property
     * @param {string} property
     * @returns {RequestSort}
     */
    remove(property: string): RequestSort {
        // remove ?
        delete this.criterias[property];

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Remove all criterias
     * @returns {RequestSort}
     */
    clear(): RequestSort {
        // clear
        this.criterias = {};

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Check if there are any criterias set
     * @returns {boolean}
     */
    isEmpty(): boolean {
        return Object.keys(this.criterias).length === 0;
    }

    /**
     * Merge sort criteria
     * @param sort
     */
    merge(
        sort: RequestSort
    ): RequestSort {
        // merge ?
        this.criterias = {
            ...this.criterias,
            ...sort.criterias
        };

        // trigger change
        this.triggerChangeListener();

        // finished
        return this;
    }

    /**
     * Generates a new "order" criteria for Loopback API
     * @returns {{}}
     */
    generateCriteria(): any {
        return this.isEmpty() ?
            [] :
            _.map(this.criterias, (direction, property) => {
                return `${property} ${direction}`;
            });
    }

    /**
     * Serialize query builder
     */
    serialize(): ISerializedQuerySort {
        return {
            criterias: this.criterias
        };
    }

    /**
     * Replace query builder filters with saved ones
     */
    deserialize(
        serializedValue: string | ISerializedQuerySort
    ): void {
        // deserialize
        const serializedValueObject: ISerializedQuerySort = _.isString(serializedValue) ?
            JSON.parse(serializedValue) :
            serializedValue as ISerializedQuerySort;

        // update data
        this.criterias = serializedValueObject.criterias;
    }
}
