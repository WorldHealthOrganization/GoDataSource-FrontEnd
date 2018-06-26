import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/permission.model';

import * as _ from 'lodash';
import { ChildNavItem, NavItem } from './nav-item.class';

@Component({
    selector: 'app-sidenav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.less']
})
export class SidenavComponent {

    // authenticated user
    authUser: UserModel;

    // Nav Item - Account
    accountItem: NavItem = new NavItem(
        '',
        'account',
        [],
        [
            new ChildNavItem(
                'Log out',
                [],
                '/auth/logout'
            ),
            new ChildNavItem(
                'Change Password',
                [],
                '/account/change-password'
            )
        ]
    );

    // Nav Items - main
    mainItems: any[] = [
        new NavItem(
            'Admin',
            'settings',
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
                ),
                new ChildNavItem(
                    'Roles',
                    [PERMISSION.READ_ROLE],
                    '/user-roles'
                )
            ]
        ),
        new NavItem(
            'Outbreaks',
            'bug',
            [PERMISSION.READ_OUTBREAK],
            [
                new ChildNavItem(
                    'Outbreaks',
                    [PERMISSION.READ_OUTBREAK],
                    '/outbreaks'
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
            'people',
            [PERMISSION.READ_CONTACT],
            [],
            '/contacts'
        ),
        new NavItem(
            'Cases',
            'addFolder',
            [],
            [],
            '/cases'
        ),
        new NavItem(
            'Events',
            'event',
            [],
            [],
            '/events'
        ),
        new NavItem(
            'Duplicated Records',
            'fileCopy',
            [],
            [],
            '/users'
        ),
        {
            separator: true
        },
        new NavItem(
            'Reference data',
            'language',
            [PERMISSION.READ_SYS_CONFIG],
            [],
            '/reference-data'
        ),
        new NavItem(
            'Help & Support',
            'help',
            [],
            [],
            '/help'
        )
    ];

    constructor(
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Check if a Menu Item should be displayed, based on the configured permissions that the authenticated user should have
     */
    shouldDisplayItem(item) {
        // check if it is an item with a Submenu list
        if (item.children && item.children.length > 0) {
            // check if there is any visible Child Item
            return _.filter(item.children, (childItem) => {
                return this.authUser.hasPermissions(...childItem.permissions);
            });
        }

        return this.authUser.hasPermissions(...item.permissions);
    }

}
