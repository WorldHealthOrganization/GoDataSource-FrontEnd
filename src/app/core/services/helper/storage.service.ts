import { Injectable } from '@angular/core';

export enum StorageKey {
    SELECTED_LANGUAGE_ID = 'SELECTED_LANGUAGE_ID',
    AUTH_DATA = 'AUTH_DATA',
    SELECTED_OUTBREAK_ID = 'SELECTED_OUTBREAK_ID'
}

@Injectable()
export class StorageService {

    set(key: StorageKey, value: any) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    get(key: StorageKey): any {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    remove(key: StorageKey) {
        localStorage.removeItem(key);
    }
}
