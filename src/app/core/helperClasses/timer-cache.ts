import { Moment } from 'moment';
import { Observable } from 'rxjs/internal/Observable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscriber } from 'rxjs/internal-compatibility';
import { share } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';

export class TimerCache {
    static readonly INVALIDATE_CACHE_AFTER_N_MS = 60000; // 1 minute
    static CACHE: {
        [cacheKey: string]: {
            createdAt: Moment,
            executeObserver$: Observable<any>,
            data: any,
            observer$: Observable<any>
        }
    } = {};

    /**
     * Do a request or retrieve it from cache if it didn't expire
     */
    static run(
        cacheKey: string,
        executeObserver$: Observable<any>
    ): Observable<any> {
        // remove older cached items
        _.each(
            TimerCache.CACHE,
            (cached, localCacheKey) => {
                if (moment().diff(cached.createdAt) >= TimerCache.INVALIDATE_CACHE_AFTER_N_MS) {
                    delete TimerCache.CACHE[localCacheKey];
                }
            }
        );

        // check if we have a request cached for this query
        if (!TimerCache.CACHE[cacheKey]) {
            // cache item
            TimerCache.CACHE[cacheKey] = {
                createdAt: moment(),
                executeObserver$: executeObserver$,
                data: null,
                observer$: new Observable<any>((function (
                    localCache,
                    localCacheKey: string
                ) {
                    return (localObserver: Subscriber<any>) => {
                        if (localCache[localCacheKey]) {
                            // do we have data already ?
                            if (localCache[localCacheKey].data !== null) {
                                localObserver.next(localCache[localCacheKey].data);
                                return;
                            }

                            // load data
                            localCache[localCacheKey].executeObserver$
                                .subscribe((data) => {
                                    localCache[localCacheKey].data = data;
                                    localObserver.next(localCache[localCacheKey].data);
                                });
                        } else {
                            // finished
                            localObserver.next([]);
                            localObserver.complete();
                        }
                    };
                })(TimerCache.CACHE, cacheKey)).pipe(share())
            };
        }

        // finished
        return TimerCache.CACHE[cacheKey].data !== null ?
            of(TimerCache.CACHE[cacheKey].data) :
            TimerCache.CACHE[cacheKey].observer$;
    }
}
