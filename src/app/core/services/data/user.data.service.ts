import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class UserDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    getUser(userId) {
        return this.http.get(`users/${userId}`);
    }
}

