import * as _ from 'lodash';
import { ExposureTypeModel } from './exposure-type';

export class ExposureTypeGroupModel {
    newContactsCount: number;
    exposureType: ExposureTypeModel[];

    constructor(data = null) {
        this.newContactsCount = _.get(data, 'newContactsCount');
        this.exposureType = _.get(data, 'exposureType', []);
    }
}
