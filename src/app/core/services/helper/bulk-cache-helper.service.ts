import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { v4 as uuid } from 'uuid';
import { LocalizationHelper, Moment } from '../../helperClasses/localization-helper';

@Injectable()
export class BulkCacheHelperService {
  // selected key prefix
  private _keySelectedPrefix: string = 'bulk_selected_';

  /**
   * Constructor
   */
  constructor(
    private storageService: StorageService
  ) {}

  /**
   * Retrieve cached data
   */
  private getCachedData(cacheKey: string): {
    created: Moment,
    selected: string[]
  } {
    return this.storageService.getAny(cacheKey);
  }

  /**
   * Generate cache key
   */
  storeBulkSelected(selected: string[]): string {
    // store
    const cacheKey: string = `${this._keySelectedPrefix}${uuid()}`;
    this.storageService.setAny(
      cacheKey, {
        created: LocalizationHelper.now(),
        selected
      }
    );

    // finished
    return cacheKey;
  }

  /**
   * Retrieve selected bulk
   */
  getBulkSelected(cacheKey: string): string[] | null {
    // nothing to do ?
    if (!cacheKey) {
      return null;
    }

    // retrieve data
    const cacheData = this.getCachedData(cacheKey);

    // return
    return cacheData?.selected?.length ?
      cacheData.selected :
      null;
  }

  /**
   * Remove selected bulk
   */
  removeBulkSelected(cacheKey: string): void {
    // nothing to do ?
    if (!cacheKey) {
      return;
    }

    // retrieve data
    this.storageService.removeAny(cacheKey);
  }

  /**
   * Remove older cache, so we don't remain out of space
   */
  clearBulkSelected(onlyExpired: boolean): void {
    // determine keys
    const bulkSelectedDataKeys: string[] = this.storageService.retrieveKeys().filter((key) => key.startsWith(this._keySelectedPrefix));
    bulkSelectedDataKeys.forEach((cacheKey) => {
      // retrieve data
      const cacheData = this.getCachedData(cacheKey);
      if (
        !onlyExpired ||
        !cacheData?.created ||
        !cacheData.selected?.length ||
        LocalizationHelper.toMoment(cacheData.created) < LocalizationHelper.now().add(-1, 'days')
      ) {
        // delete
        this.storageService.removeAny(cacheKey);
      }
    });
  }
}
