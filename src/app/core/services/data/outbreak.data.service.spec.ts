import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../models/outbreak.model';
import * as _ from 'lodash';

export class OutbreakDataServiceMock {
    static selectedOutbreakId = 'outbreak 1';

    static outbreaks: OutbreakModel[] = [
        new OutbreakModel({
            id: OutbreakDataServiceMock.selectedOutbreakId
        })
    ];

    getSelectedOutbreak(): Observable<OutbreakModel> {
        return Observable.of(_.find(OutbreakDataServiceMock.outbreaks, { id: OutbreakDataServiceMock.selectedOutbreakId }));
    }

    getSelectedOutbreakSubject(): Observable<OutbreakModel> {
        return this.getSelectedOutbreak();
    }
}

