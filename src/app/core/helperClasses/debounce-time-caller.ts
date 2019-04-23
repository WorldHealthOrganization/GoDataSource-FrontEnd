import { Constants } from '../models/constants';
import { Subscriber } from 'rxjs';

export class DebounceTimeCaller {
    // The ID value of the timer
    protected refreshTimeoutID: any = null;

    // initialize
    constructor(
        private subscriber: Subscriber<void>,
        private time: number = Constants.DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS
    ) {}

    /**
     * Clear previous refresh request
     */
    protected clearRefreshTimeout() {
        if (this.refreshTimeoutID) {
            clearTimeout(this.refreshTimeoutID);
            this.refreshTimeoutID = null;
        }
    }

    /**
     * Execute subscriber
     * @param instant True if you don't want to wait for debounce time
     */
    call(instant: boolean = false) {
        // do we want to execute call instantly ?
        if (instant) {
            // stop the previous one
            this.clearRefreshTimeout();

            // call
            this.subscriber.next();
        } else {
            // stop previous request
            this.clearRefreshTimeout();

            // wait for debounce time
            // make new request
            this.refreshTimeoutID = setTimeout(() => {
                // call
                this.subscriber.next();

                // timeout executed - clear
                this.refreshTimeoutID = null;
            }, this.time);
        }
    }
}
