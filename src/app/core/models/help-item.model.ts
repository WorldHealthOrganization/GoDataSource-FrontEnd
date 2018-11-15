import * as _ from 'lodash';

export class HelpItemModel {
    id: string;
    title: string;
    content: string;
    categoryId: string;
    approved: boolean;
    approvedBy: string;
    approvedDate: string;
    comment: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.title = _.get(data, 'title');
        this.content = _.get(data, 'content');
        this.categoryId = _.get(data, 'categoryId');
        this.approved = _.get(data, 'approved', false);
        this.approvedBy = _.get(data, 'approvedBy');
        this.approvedDate = _.get(data, 'approvedDate');
        this.comment = _.get(data, 'comment');
    }

}
