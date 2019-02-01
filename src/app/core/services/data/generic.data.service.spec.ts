import * as moment from 'moment';
import { GenericDataService } from './generic.data.service';
import { Observable } from 'rxjs/Observable';

const CURRENT_DATE = moment.utc().format();

export class GenericDataServiceMock extends GenericDataService {
    getServerUTCCurrentDateTime(): Observable<string> {
        return Observable.of(CURRENT_DATE);
    }
}
