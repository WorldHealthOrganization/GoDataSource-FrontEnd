import * as _ from 'lodash';

export class AttachmentModel {
    outbreakId: string;
    name: string;
    originalName: string;
    mimeType: string;
    id: string;

    constructor(data = null) {
        this.outbreakId = _.get(data, 'outbreakId');
        this.name = _.get(data, 'name');
        this.originalName = _.get(data, 'originalName');
        this.mimeType = _.get(data, 'mimeType');
        this.id = _.get(data, 'id');
    }
}
