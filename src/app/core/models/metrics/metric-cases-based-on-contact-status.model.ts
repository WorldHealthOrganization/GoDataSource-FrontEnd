import * as _ from 'lodash';

export class MetricCasesBasedOnContactStatusModel {
    start: string;
    end: string;
    totalCasesCount: any;
    totalCasesNotFromContact: number;
    totalCasesFromContactWithFollowupComplete: number;
    totalCasesFromContactWithFollowupLostToFollowup: number;
    caseIDs: any;
    caseFromContactWithFollowupCompleteIDs: number;
    caseFromContactWithFollowupLostToFollowupIDs: number;
    percentageOfCasesWithFollowupData: number;


    constructor(data = null) {
        this.start = _.get(data, 'start', '');
        this.end = _.get(data, 'end', '');
        this.totalCasesCount = _.get(data, 'totalCasesCount', 0);
        this.totalCasesNotFromContact = _.get(data, 'totalCasesNotFromContact', 0);
        this.totalCasesFromContactWithFollowupComplete = _.get(data, 'totalCasesFromContactWithFollowupComplete', 0);
        this.totalCasesFromContactWithFollowupLostToFollowup = _.get(data, 'totalCasesFromContactWithFollowupLostToFollowup', 0);
        this.caseIDs = _.get(data, 'caseIDs', []);
        this.caseFromContactWithFollowupCompleteIDs = _.get(data, 'caseFromContactWithFollowupCompleteIDs', 0);
        this.caseFromContactWithFollowupLostToFollowupIDs = _.get(data, 'caseFromContactWithFollowupLostToFollowupIDs', 0);
        this.percentageOfCasesWithFollowupData = _.get(data, 'percentageOfCasesWithFollowupData', 0);
    }
}
