import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ApiService } from './api.service';

@Injectable()
export class UserDataService extends ApiService {

    constructor(
        private http: HttpClient
    ) {
        super(http);
    }

    getUser(userId) {
        return this.get(`api/users/${userId}`);
    }
}

