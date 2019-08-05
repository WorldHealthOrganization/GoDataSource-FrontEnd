import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';

@Injectable()
export class OutbreakResolver implements Resolve<Observable<OutbreakModel>> {

    constructor(
        private outbreakDataService: OutbreakDataService
    ) {
    }

    resolve(
        route: ActivatedRouteSnapshot
    ) {
        return this.outbreakDataService.getOutbreak(
            route.paramMap.get('outbreakId'),
            true
        );
    }
}
