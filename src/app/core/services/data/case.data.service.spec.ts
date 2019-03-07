import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { CaseModel } from '../../models/case.model';
import * as moment from 'moment';
import { CaseCenterDateRangeModel } from '../../models/case-center-date-range.model';

export const CaseDataServiceMock: {
    selectedCaseId: string,
    cases: {
        [outbreakId: string]: CaseModel[]
    },
    getCase: (outbreakId: string, caseId: string) => Observable<CaseModel>
} = {
    selectedCaseId: 'case 1',

    cases: {
        'outbreak 1': [
            new CaseModel({
                id: 'case 1',
                dateOfOnset: moment('2019-03-01', 'YYYY-MM-DD'),
                dateOfInfection: moment('2019-03-02', 'YYYY-MM-DD'),
                dateOfOutcome: moment('2019-03-03', 'YYYY-MM-DD'),
                dateBecomeCase: moment('2019-03-04', 'YYYY-MM-DD'),
                dateRanges: [
                    new CaseCenterDateRangeModel({
                        startDate: moment('2019-03-05', 'YYYY-MM-DD'),
                        endDate: moment('2019-03-06', 'YYYY-MM-DD'),
                        typeId: 'Type 1'
                    }),
                    new CaseCenterDateRangeModel({
                        startDate: moment('2019-03-07', 'YYYY-MM-DD'),
                        endDate: moment('2019-03-08', 'YYYY-MM-DD'),
                        typeId: 'Type 2'
                    })
                ],
                classificationHistory: [
                    {
                        classification: 'Classification 1',
                        startDate: moment('2019-03-09', 'YYYY-MM-DD'),
                        endDate: moment('2019-03-10', 'YYYY-MM-DD')
                    }
                ]
            })
        ]
    },

    getCase: (
        outbreakId: string,
        caseId: string
    ): Observable<CaseModel> => {
        return Observable.of(
            CaseDataServiceMock.cases[outbreakId] ?
                _.find(CaseDataServiceMock.cases[outbreakId], { id: caseId }) :
                undefined
        );
    }
};
