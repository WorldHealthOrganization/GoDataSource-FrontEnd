import { Injectable } from '@angular/core';

/**
 * Storage keys
 */
export enum StorageKey {
  SELECTED_LANGUAGE_ID = 'SELECTED_LANGUAGE_ID',
  LANGUAGE_UPDATE_LAST = 'LANGUAGE_UPDATE_LAST',
  AUTH_DATA = 'AUTH_DATA',
  SELECTED_OUTBREAK_ID = 'SELECTED_OUTBREAK_ID',
  FILTERS = 'FILTERS'
}

@Injectable()
export class StorageService {
  /**
   * Push system data to storage
   */
  set(
    key: StorageKey,
    value: any
  ): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Push any data to storage
   */
  setAny(
    key: string,
    value: any
  ): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Pull system data from storage
   */
  get(key: StorageKey): any {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  /**
   * Pull any data from storage
   */
  getAny(key: string): any {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  /**
   * Remove system data from storage
   */
  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  }

  /**
   * Remove any data from storage
   */
  removeAny(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Retrieve keys
   */
  retrieveKeys(): string[] {
    // construct list of used storage keys
    const keys: string[] = [];
    for (let keyIndex = 0; keyIndex < localStorage.length; keyIndex++) {
      keys.push(localStorage.key(keyIndex));
    }

    // finished
    return keys;
  }
}
