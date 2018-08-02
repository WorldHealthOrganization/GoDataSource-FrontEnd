import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';

export class EventModel {
    id: string;
    name: string;
    date: string;
    dateApproximate: boolean;
    description: string;
    address: AddressModel;
    type: EntityType = EntityType.EVENT;
    dateOfReporting: string;
    isDateOfReportingApproximate: boolean;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.date = _.get(data, 'date');
        this.dateApproximate = _.get(data, 'dateApproximate');
        this.description = _.get(data, 'description');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');

        // we need the object to use the custom getter that constructs the address from all fields
        this.address = new AddressModel(_.get(data, 'address'));
    }
}
