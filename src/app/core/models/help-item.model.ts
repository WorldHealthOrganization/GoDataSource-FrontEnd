import * as _ from 'lodash';
import { UserModel } from './user.model';
import { HelpCategoryModel } from './help-category.model';
import { IPermissionBasic, IPermissionHelp } from './permission.interface';
import { PERMISSION } from './permission.model';
import { BaseModel } from './base.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';

export class HelpItemModel extends BaseModel
  implements
        IPermissionBasic,
        IPermissionHelp {
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
  order: number;

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_VIEW, PERMISSION.HELP_CATEGORY_ITEM_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_DELETE) : false; }

  /**
   * Static Permissions - IPermissionHelp
   */
  static canApproveCategoryItems(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_ITEM_APPROVE) : false; }

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    options: {
      helpCategory: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // finished
    return [
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'categoryId',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY',
        options: data.options.helpCategory,
        sortable: true
      }
    ];
  }

  /**
   * Constructor
   */
  constructor(data = null) {
    super(data);

    this.id = _.get(data, 'id');
    this.title = _.get(data, 'title');
    this.content = _.get(data, 'content', '');
    this.categoryId = _.get(data, 'categoryId');
    this.approved = _.get(data, 'approved', false);
    this.approvedBy = _.get(data, 'approvedBy');
    this.approvedDate = _.get(data, 'approvedDate');
    this.comment = _.get(data, 'comment');
    this.user = _.get(data, 'user');
    this.category = _.get(data, 'category');
    this.page = _.get(data, 'page');
    this.order = _.get(data, 'order');
  }

  /**
   * Permissions - IPermissionBasic
   */
  canView(user: UserModel): boolean { return HelpItemModel.canView(user); }
  canList(user: UserModel): boolean { return HelpItemModel.canList(user); }
  canCreate(user: UserModel): boolean { return HelpItemModel.canCreate(user); }
  canModify(user: UserModel): boolean { return HelpItemModel.canModify(user); }
  canDelete(user: UserModel): boolean { return HelpItemModel.canDelete(user); }

  /**
   * Permissions - IPermissionHelp
   */
  canApproveCategoryItems(user: UserModel): boolean { return HelpItemModel.canApproveCategoryItems(user); }
}
