import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export enum StorageKey {
    AUTH_DATA = 'AUTH_DATA'
}

@Injectable()
export class StorageService {

    set(key: StorageKey, value: string) {
        localStorage.setItem(key, value);
    }

    get(key: StorageKey): string {
        return localStorage.getItem(key);
    }
}

