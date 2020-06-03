import * as _ from 'lodash';
import { PERMISSION } from '../../models/permission.model';
import { PermissionExpression } from '../../models/user.model';

export class AbstractNavItem {
    // used to fast determine if we have access to this item
    public access: {
        allowed?: boolean,
        userPermissionsHash?: number,
        outbreakId?: string
    } = {};

    /**
     * Constructor
     */
    constructor(
        private _visible: boolean | ((c: AbstractNavItem | void) => boolean) = true
    ) {}

    /**
     * Is Visible ?
     */
    get isVisible(): boolean {
        return _.isFunction(this._visible) ?
            (this._visible as ((c: AbstractNavItem | void) => boolean))(this) :
            (this._visible as boolean);
    }

    /**
     * Set visibility
     */
    set visible(visible: boolean | ((c: AbstractNavItem | void) => boolean)) {
        this._visible = visible;
    }
}

/**
 * Separator
 */
export class SeparatorItem extends AbstractNavItem {
    // separator id
    get separator(): boolean {
        return true;
    }

    /**
     * Constructor
     */
    constructor(
        visible: boolean | ((c: SeparatorItem | void) => boolean) = true
    ) {
        super(visible);
    }
}

export class ChildNavItem extends AbstractNavItem {
    /**
     * Constructor
     */
    constructor(
        public id: string,
        public label: string,
        public permissions: PERMISSION[] | PermissionExpression | ((UserModel) => boolean)[] = [],
        public link: string | null = null,
        visible: boolean | ((c: ChildNavItem | void) => boolean) = true
    ) {
        super(visible);
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
        public permissions: PERMISSION[] | PermissionExpression | ((UserModel) => boolean)[] = [],
        public children: ChildNavItem[] = [],
        public link: string | null = null,
        visible: boolean | ((n: NavItem | void) => boolean) = true
    ) {
        super(visible);
    }
}
