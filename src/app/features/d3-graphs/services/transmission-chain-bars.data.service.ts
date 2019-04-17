import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { Observable } from 'rxjs';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { map } from 'rxjs/operators';
import { CaseBarModel } from '../typings/case-bar.model';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Constants } from '../../../core/models/constants';

@Injectable()
export class TransmissionChainBarsDataService {
    constructor(
        private http: HttpClient
    ) {}

    /**
     * Retrieve the list of Cases to build up the transmission chain
     */
    getTransmissionChainBarsData(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainBarsModel> {
        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/cases/bars-transmission-chains?filter=${filter}`)
            .pipe(map((data: TransmissionChainBarsModel) => {
                // #TODO remove when API is fixed

                // determine minGraphDate
                let minGraphDate = data.minGraphDate;

                // determine firstGraphDate for each Case
                for (const key in data.casesMap) {
                    const caseData = data.casesMap[key] as CaseBarModel;
                    let firstGraphDate = caseData.dateOfOnset;

                    _.each(caseData.dateRanges, (dateRange) => {
                        firstGraphDate = moment(dateRange.startDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) < moment(firstGraphDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) ? dateRange.startDate : firstGraphDate;
                    });

                    _.each(caseData.labResults, (labResult) => {
                        firstGraphDate = moment(labResult.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) < moment(firstGraphDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) ? labResult.dateSampleTaken : firstGraphDate;
                    });

                    data.casesMap[key].firstGraphDate = firstGraphDate;

                    if (moment(firstGraphDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) < moment(minGraphDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)) {
                        minGraphDate = firstGraphDate;
                    }
                }

                data.minGraphDate = minGraphDate;

                return data;
            })) as Observable<TransmissionChainBarsModel>;
    }
}
