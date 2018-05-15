import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import {OutbreakModel} from "../../models/outbreak.model";


@Injectable()
export class OutbreakDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    getOutbreak(outbreakId) {

        return this.http.get(`outbreaks/${outbreakId}`);
    }

    getOutbreaks(){
        return this.http.get(`outbreaks`);
    }

    create(outbreak): Observable<any> {
        return this.http.post(`outbreaks`, outbreak)
            .do((res) => {
                // TODO : handle response
            });
    }

}

