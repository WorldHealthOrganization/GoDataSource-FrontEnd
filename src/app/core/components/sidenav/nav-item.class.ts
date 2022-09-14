import { PERMISSION } from '../../models/permission.model';
import { PermissionExpression, UserModel } from '../../models/user.model';

export class AbstractNavItem {
  /**
   * Constructor
   */
  constructor(
    public visible: boolean
  ) {}
}

export class ChildNavItem extends AbstractNavItem {
  /**
   * Constructor
   */
  constructor(
    public id: string,
    public label: string,
    public permissions: PERMISSION[] | PermissionExpression = [],
    public link: string | null = null,
    public additionalVisibilityCheck?: () => boolean
  ) {
    super(false);

    // validate
    if (this.id.indexOf(' ') > -1) {
      throw new Error('Spaces not allowed');
    }
  }
}

export class NavItem extends AbstractNavItem {
  /**
   * Constructor
   */
  constructor(
    public id: string,
    public label: string,
    public icon: string,
    public permissions: PERMISSION[] | PermissionExpression | ((u: UserModel) => boolean) = [],
    public children: ChildNavItem[] = [],
    public link: string | null = null,
    public additionalVisibilityCheck?: () => boolean
  ) {
    super(false);

    // validate
    if (this.id.indexOf(' ') > -1) {
      throw new Error('Spaces not allowed');
    }
  }
}
