import { Constants } from '../models/constants';

export enum DebounceTimeCallerType {
  RESET_AND_WAIT_FOR_NEXT,
  DONT_RESET_AND_WAIT
}

export class DebounceTimeCaller {
  // The ID value of the timer
  protected refreshTimeoutID: number;

  // initialize
  constructor(
    private subscriber: () => void,
    private time: number = Constants.DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS,
    private type: DebounceTimeCallerType = DebounceTimeCallerType.RESET_AND_WAIT_FOR_NEXT
  ) {}

  /**
   * Clear previous refresh request
   */
  protected clearRefreshTimeout() {
    if (this.refreshTimeoutID) {
      clearTimeout(this.refreshTimeoutID);
      this.refreshTimeoutID = undefined;
    }
  }

  /**
   * Execute subscriber
   * @param instant True if you don't want to wait for debounce time
   */
  call(instant: boolean = false) {
    // no subscriber ?
    if (!this.subscriber) {
      return;
    }

    // do we want to execute call instantly ?
    if (instant) {
      // stop the previous one
      this.clearRefreshTimeout();

      // call
      this.subscriber();
    } else {
      this.callAfterMs(this.time);
    }
  }

  /**
   * Call after a specific number of ms
   * @param waitForMs Number of ms to wait before calling subscriber
   */
  callAfterMs(waitForMs: number) {
    if (
      this.type === DebounceTimeCallerType.RESET_AND_WAIT_FOR_NEXT || (
        this.type === DebounceTimeCallerType.DONT_RESET_AND_WAIT &&
        !this.refreshTimeoutID
      )
    ) {
      // stop previous request
      this.clearRefreshTimeout();

      // wait for debounce time
      // make new request
      this.refreshTimeoutID = setTimeout(() => {
        // reset
        this.refreshTimeoutID = undefined;

        // no subscriber ?
        if (!this.subscriber) {
          return;
        }

        // call
        this.subscriber();
      }, waitForMs);
    }
  }

  /**
   * Release resources
   */
  unsubscribe() {
    // release
    if (this.subscriber) {
      this.subscriber = null;
    }

    // stop previous request
    this.clearRefreshTimeout();
  }
}
