import { GenericDataService } from './generic.data.service';
import { Observable, of } from 'rxjs';
import { moment } from '../../helperClasses/x-moment';

const CURRENT_DATE = moment.utc().format();

export class GenericDataServiceMock extends GenericDataService {
    getServerUTCCurrentDateTime(): Observable<string> {
        return of(CURRENT_DATE);
    }
}
