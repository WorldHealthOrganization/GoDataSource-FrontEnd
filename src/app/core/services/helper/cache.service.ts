import { Injectable } from '@angular/core';
import * as _ from 'lodash';

export enum CacheKey {
    AUTH_ROLES = 'AUTH_ROLES',
    PERMISSIONS = 'PERMISSIONS',
    LANGUAGES = 'LANGUAGES',
    LOCATIONS = 'LOCATIONS',
    REFERENCE_DATA = 'REFERENCE_DATA',
    HELP_ITEMS = 'HELP_ITEMS',
    API_VERSION = 'API_VERSION'
}

@Injectable()
export class CacheService {

    /**
     * Property keeping all the cached objects
     * @type {{}}
     */
    private cacheObjects = {};

    set(key: CacheKey, value: any) {
        _.set(this.cacheObjects, key, value);
    }

    get(key: CacheKey): any {
        return _.get(this.cacheObjects, key);
    }

    remove(key: CacheKey) {
        this.set(key, null);
    }
}
