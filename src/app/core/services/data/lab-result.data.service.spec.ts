import { Observable, of } from 'rxjs';
import { LabResultModel } from '../../models/lab-result.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { moment } from '../../helperClasses/x-moment';
import { EntityType } from '../../models/entity-type';

export const LabResultDataServiceMock: {
    selectedLabResultId: string,
    labResults: {
        [outbreakId: string]: {
            [caseId: string]: LabResultModel[]
        }
    },
    getEntityLabResults: (outbreakId: string, entityPath: string, entityId: string, queryBuilder?: RequestQueryBuilder) => Observable<LabResultModel[]>
} = {
    selectedLabResultId: 'labResult 1',

    labResults: {
        'outbreak 1': {
            'case 1': [
                new LabResultModel({
                    id: 'labResult 1',
                    dateOfResult: moment('2019-04-01', 'YYYY-MM-DD'),
                    personType: EntityType.CASE
                })
            ]
        }
    },

    getEntityLabResults: (
        outbreakId: string,
        entityPath: string,
        entityId: string
    ): Observable<LabResultModel[]> => {
        // finished
        return of(LabResultDataServiceMock.labResults[outbreakId] && LabResultDataServiceMock.labResults[outbreakId][entityId] ?
            LabResultDataServiceMock.labResults[outbreakId][entityId] :
            []
        );
    }
};
