import * as _ from 'lodash';
import { UserModel } from './user.model';
import { HelpCategoryModel } from './help-category.model';

export class HelpItemModel {
    id: string;
    title: string;
    content: string;
    categoryId: string;
    approved: boolean;
    approvedBy: string;
    approvedDate: string;
    comment: string;
    user: UserModel;
    category: HelpCategoryModel;
    page: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.title = _.get(data, 'title');
        this.content = _.get(data, 'content');
        this.categoryId = _.get(data, 'categoryId');
        this.approved = _.get(data, 'approved', false);
        this.approvedBy = _.get(data, 'approvedBy');
        this.approvedDate = _.get(data, 'approvedDate');
        this.comment = _.get(data, 'comment');
        this.user = _.get(data, 'user');
        this.category = _.get(data, 'category');
        this.page = _.get(data, 'page');

    }

}
