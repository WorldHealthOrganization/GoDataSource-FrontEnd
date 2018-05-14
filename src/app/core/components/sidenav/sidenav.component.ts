import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/user-role.model';

import * as _ from 'lodash';
import { ChildNavItem, NavItem } from './nav-item.class';

@Component({
    selector: 'app-sidenav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.less']
})
export class SidenavComponent implements OnInit {

    // authenticated user
    authUser: UserModel;

    // Nav items with configuration
    items: NavItem[] = [
        new NavItem(
            'Admin',
            'admin',
            [],
            [
                new ChildNavItem(
                    'System Configuration',
                    [PERMISSION.READ_SYS_CONFIG],
                    ''
                ),
                new ChildNavItem(
                    'Users',
                    [PERMISSION.READ_USER_ACCOUNT],
                    '/users'
                )
            ]
        ),
        new NavItem(
            'Outbreaks',
            'outbreaks',
            [PERMISSION.READ_OUTBREAK],
            [
                new ChildNavItem(
                    'Outbreak List',
                    [],
                    '/users'
                ),
                new ChildNavItem(
                    'Templates',
                    [],
                    '/users'
                ),
                new ChildNavItem(
                    'Teams',
                    [PERMISSION.READ_TEAM],
                    '/users'
                ),
                new ChildNavItem(
                    'Clusters',
                    [],
                    '/users'
                )
            ]
        ),
        new NavItem(
            'Contacts',
            'contacts',
            [],
            [],
            '/users'
        ),
        new NavItem(
            'Cases',
            'cases',
            [],
            [],
            '/users'
        ),
        new NavItem(
            'Events',
            'events',
            [],
            [],
            '/users'
        ),
        new NavItem(
            'Duplicated Records',
            'duplicate',
            [],
            [],
            '/users'
        ),
        new NavItem(
            'Account',
            'account',
            [],
            [],
            '/users'
        )
    ];

    constructor(
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        // filter the Nav items based on user's Role
        this.items = this.items.reduce((acc, item) => {

            const itemPermissions = _.get(item, 'permissions', []);

            // check if user has permission to view the main item
            if (this.authUser.hasPermissions(...itemPermissions)) {
                // user has access to current item

                // filter the children items that user has access to
                const children = _.filter(item.children, (childItem) => {

                    const childItemPermissions = _.get(item, 'permissions', []);

                    return this.authUser.hasPermissions(...childItemPermissions);
                });

                // keep only available children items
                item.children = children;

                // the Nav Item must either have a link or at least one child item
                if (item.link || item.children.length > 0) {
                    acc.push(item);
                    return acc;
                }
            }

            return acc;
        }, []);
    }

}
