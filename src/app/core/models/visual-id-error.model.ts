import * as _ from 'lodash';

export enum VisualIdErrorModelCode {
    INVALID_VISUAL_ID_MASK = 'INVALID_VISUAL_ID_MASK',
    DUPLICATE_VISUAL_ID = 'DUPLICATE_VISUAL_ID'
}

export class VisualIdErrorModel {
    statusCode: number;
    name: string;
    message: string;
    code: VisualIdErrorModelCode;
    details: {
        visualIdTemplate: string,
        outbreakVisualIdMask: string
    };

    constructor(data = null) {
        this.statusCode = _.get(data, 'statusCode');
        this.name = _.get(data, 'name');
        this.message = _.get(data, 'message');
        this.code = _.get(data, 'code');
        this.details = _.get(data, 'details');
    }
}
