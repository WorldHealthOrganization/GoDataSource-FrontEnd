import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export enum StorageKey {
    AUTH_DATA = 'AUTH_DATA',
    ACTIVE_OUTBREAK = 'ACTIVE_OUTBREAK'
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
