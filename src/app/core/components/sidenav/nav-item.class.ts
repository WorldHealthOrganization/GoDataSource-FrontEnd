import { PERMISSION } from '../../models/permission.model';

export class ChildNavItem {

    constructor(
        public label: string,
        public permissions: PERMISSION[] = [],
        public link: string | null = null
    ) {
    }
}

export class NavItem {

    constructor(
        public label: string,
        public icon: string,
        public permissions: PERMISSION[] = [],
        public children: ChildNavItem[] = [],
        public link: string | null = null
    ) {
    }
}
