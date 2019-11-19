import * as _ from 'lodash';
import { PERMISSION } from '../../models/permission.model';
import { PermissionExpression } from '../../models/user.model';

export class AbstractNavItem {
    constructor(
        private _visible: boolean | ((c: AbstractNavItem | void) => boolean) = true
    ) {}

    get isVisible(): boolean {
        return _.isFunction(this._visible) ?
            (this._visible as ((c: AbstractNavItem | void) => boolean))(this) :
            (this._visible as boolean);
    }

    set visible(visible: boolean | ((c: AbstractNavItem | void) => boolean)) {
        this._visible = visible;
    }
}

export class ChildNavItem extends AbstractNavItem {

    constructor(
        public id: string,
        public label: string,
        public permissions: PERMISSION[] | PermissionExpression = [],
        public link: string | null = null,
        visible: boolean | ((c: ChildNavItem | void) => boolean) = true
    ) {
        super(visible);
    }
}

export class NavItem extends AbstractNavItem {

    constructor(
        public id: string,
        public label: string,
        public icon: string,
        public permissions: PERMISSION[] | PermissionExpression = [],
        public children: ChildNavItem[] = [],
        public link: string | null = null,
        visible: boolean | ((n: NavItem | void) => boolean) = true
    ) {
        super(visible);
    }
}
