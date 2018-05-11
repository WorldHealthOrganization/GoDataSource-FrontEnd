import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class UserDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    getUser(userId) {

        // include role and permissions in response
        const includes = JSON.stringify({
            include: 'role'
        });

        return this.http.get(`users/${userId}?filter=${includes}`);
    }
}

