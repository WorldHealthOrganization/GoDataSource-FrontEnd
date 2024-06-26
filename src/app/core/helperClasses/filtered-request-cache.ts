import { Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';

export class FilteredRequestCache {
  /**
     * Cached data
     */
  private static sharedRequests: {
    [key: string]: {
      [filter: string]: Observable<any>
    }
  } = {};

  /**
     * Get cached observer
     */
  static get(
    key: string,
    filter: string,
    observerCreator: () => Observable<any>
  ): Observable<any> {
    // check if we have the request already cached
    // _.get not working here
    let observer: Observable<any> = FilteredRequestCache.sharedRequests[key] && FilteredRequestCache.sharedRequests[key][filter] ?
      FilteredRequestCache.sharedRequests[key][filter] :
      null;
    if (!observer) {
      // init key cache
      if (!FilteredRequestCache.sharedRequests[key]) {
        FilteredRequestCache.sharedRequests[key] = {};
      }

      // create observer handler
      observer = observerCreator()
        .pipe(
          tap(() => {
            delete FilteredRequestCache.sharedRequests[key][filter];
          }),
          share()
        );

      // cache request
      FilteredRequestCache.sharedRequests[key][filter] = observer;
    }

    // finished
    return observer;
  }
}
