import { PageEvent } from '@angular/material/paginator';
import * as _ from 'lodash';

/**
 * Serialized
 */
export interface ISerializedQueryPaginator {
  limit: number;
  skip: number;
}

/**
 * Paginator
 */
export class RequestPaginator {
  // number of elements to retrieve
  limit: number;
  // number of elements to skip
  skip: number;

  // retrieve one more to know if we have more pages ?
  // default - old behavior - do not retrieve one more
  retrieveOneMore: boolean = false;

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
   * Change page
   */
  setPage(
    page: (PageEvent | { pageSize: number, pageIndex: number }),
    disableOnChange: boolean = false
  ): RequestPaginator {
    // limit
    this.limit = page.pageSize;
    this.skip = page.pageSize * page.pageIndex;

    // trigger change
    if (!disableOnChange) {
      this.triggerChangeListener();
    }

    // finished
    return this;
  }

  /**
   * Reset to first page
   */
  reset(): RequestPaginator {
    // reset ?
    this.skip = 0;

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
   * Clear pagination criteria
   */
  clear(): RequestPaginator {
    // clear
    delete this.limit;
    delete this.skip;

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
   * Check if there are any pagination criteria
   */
  isEmpty(): boolean {
    return this.limit === undefined && this.skip === undefined;
  }

  /**
   * Serialize query builder
   */
  serialize(): ISerializedQueryPaginator {
    return {
      limit: this.limit,
      skip: this.skip
    };
  }

  /**
   * Replace query builder filters with saved ones
   */
  deserialize(
    serializedValue: string | ISerializedQueryPaginator
  ): void {
    // deserialize
    const serializedValueObject: ISerializedQueryPaginator = _.isString(serializedValue) ?
      JSON.parse(serializedValue) :
      serializedValue as ISerializedQueryPaginator;

    // update data
    this.limit = serializedValueObject.limit;
    this.skip = serializedValueObject.skip;
  }
}
