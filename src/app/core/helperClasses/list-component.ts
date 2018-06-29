import { RequestQueryBuilder } from '../services/helper/request-query-builder';

export abstract class ListComponent {
    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    /**
     * Refresh list
     */
    public abstract refreshList();

    /**
     * Filter asc / desc by specific fields
     * @param data
     */
    public sortBy(data) {
        // sort by
        this.queryBuilder.sort(data);

        // refresh list
        this.refreshList();
    }
}
