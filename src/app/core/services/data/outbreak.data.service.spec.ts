import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../models/outbreak.model';
import * as _ from 'lodash';

export const OutbreakDataServiceMock: {
    selectedOutbreakId: string,
    outbreaks: OutbreakModel[],
    getSelectedOutbreak: () => Observable<OutbreakModel>,
    getSelectedOutbreakSubject: () => Observable<OutbreakModel>
} = {
    selectedOutbreakId: 'outbreak 1',

    outbreaks: [
        new OutbreakModel({
            id: 'outbreak 1'
        })
    ],

    getSelectedOutbreak: (): Observable<OutbreakModel> => {
        return Observable.of(_.find(OutbreakDataServiceMock.outbreaks, { id: OutbreakDataServiceMock.selectedOutbreakId }));
    },

    getSelectedOutbreakSubject: (): Observable<OutbreakModel> => {
        return OutbreakDataServiceMock.getSelectedOutbreak();
    }
};

