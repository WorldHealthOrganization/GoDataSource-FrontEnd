import { PageEvent } from '@angular/material';

export class RequestPaginator {
    // number of elements to retrieve
    limit: number;
    // number of elements to skip
    skip: number;

    /**
     * Change page
     * @param {PageEvent} page
     * @returns {RequestPaginator}
     */
    setPage(page: (PageEvent | {pageSize: number, pageIndex: number})) {
        this.limit = page.pageSize;
        this.skip = page.pageSize * page.pageIndex;

        return this;
    }

    /**
     * Reset to first page
     * @returns {RequestPaginator}
     */
    reset() {
        this.skip = 0;

        return this;
    }

    /**
     * Clear pagination criterias
     * @returns {RequestPaginator}
     */
    clear() {
        delete this.limit;
        delete this.skip;

        return this;
    }

    /**
     * Check if there are any pagination criterias
     * @returns {boolean}
     */
    isEmpty() {
        return this.limit === undefined && this.skip === undefined;
    }
}
