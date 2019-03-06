import { Observable } from 'rxjs/Observable';
import { LabResultModel } from '../../models/lab-result.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as moment from 'moment';

export const LabResultDataServiceMock: {
    selectedLabResultId: string,
    labResults: {
        [outbreakId: string]: {
            [caseId: string]: LabResultModel[]
        }
    },
    getCaseLabResults: (outbreakId: string, caseId: string, queryBuilder?: RequestQueryBuilder) => Observable<LabResultModel[]>
} = {
    selectedLabResultId: 'labResult 1',

    labResults: {
        'outbreak 1': {
            'case 1': [
                new LabResultModel({
                    id: 'labResult 1',
                    dateOfResult: moment('2019-04-01', 'YYYY-MM-DD')
                })
            ]
        }
    },

    getCaseLabResults: (
        outbreakId: string,
        caseId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<LabResultModel[]> => {
        // finished
        return Observable.of(LabResultDataServiceMock.labResults[outbreakId] && LabResultDataServiceMock.labResults[outbreakId][caseId] ?
            LabResultDataServiceMock.labResults[outbreakId][caseId] :
            []
        );
    }
};
