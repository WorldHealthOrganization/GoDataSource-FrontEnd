import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ApiService } from './api.service';

@Injectable()
export class AuthenticationDataService extends ApiService {

    constructor(
        private http: HttpClient
    ) {
        super(http);

        console.log('AuthenticationDataService - constructor');
    }

    login(user) {
        return this.post(this.apiUrl, user);
    }
}

