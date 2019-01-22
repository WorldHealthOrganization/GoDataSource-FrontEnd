import * as _ from 'lodash';
import { Moment } from 'moment';
import { LocationModel } from './location.model';

export class CaseCenterDateRangeModel {
    startDate: string | Moment;
    endDate: string | Moment;
    centerName: string;
    locationId: string;
    location: LocationModel;
    comments: string;

    constructor(data = null, locationsList = []) {
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.centerName = _.get(data, 'centerName');
        this.locationId = _.get(data, 'locationId');
        // find the location
        const location = _.find(locationsList, {id: this.locationId});
        this.location = new LocationModel(location);
        this.comments = _.get(data, 'comments');
    }

    /**
     * Clone class
     */
    sanitize(): Object {
        // create clone
        const instance = _.cloneDeep(this);

        // remove properties that we don't want to save
        delete instance.location;

        // finished
        return instance;
    }
}