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
                'LNG_LAYOUT_MENU_ITEM_LOGOUT_LABEL',
                [],
                '/auth/logout'
            ),
            new ChildNavItem(
                'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL',
                [],
                '/account/change-password'
            ),
            new ChildNavItem(
                'Set Security Questions',
                [],
                '/account/set-security-questions'
            )
        ]
    );

    // Nav Items - main
    mainItems: any[] = [
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL',
            'settings',
            [],
            [
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_SYSTEM_CONFIG_LABEL',
                    [PERMISSION.READ_SYS_CONFIG],
                    ''
                ),
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_USERS_LABEL',
                    [PERMISSION.READ_USER_ACCOUNT],
                    '/users'
                ),
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_ROLES_LABEL',
                    [PERMISSION.READ_ROLE],
                    '/user-roles'
                )
            ]
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL',
            'bug',
            [PERMISSION.READ_OUTBREAK],
            [
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL',
                    [PERMISSION.READ_OUTBREAK],
                    '/outbreaks'
                ),
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEMPLATES_LABEL',
                    [],
                    '/users'
                ),
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEAMS_LABEL',
                    [PERMISSION.READ_TEAM],
                    '/users'
                ),
                new ChildNavItem(
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_CLUSTERS_LABEL',
                    [],
                    '/users'
                )
            ]
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_CONTACTS_LABEL',
            'people',
            [PERMISSION.READ_CONTACT],
            [],
            '/contacts'
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_CASES_LABEL',
            'addFolder',
            [],
            [],
            '/cases'
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL',
            'event',
            [PERMISSION.READ_EVENT],
            [],
            '/events'
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL',
            'fileCopy',
            [],
            [],
            '/users'
        ),
        {
            separator: true
        },
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL',
            'language',
            [PERMISSION.READ_SYS_CONFIG],
            [],
            '/reference-data'
        ),
        new NavItem(
            'LNG_LAYOUT_MENU_ITEM_HELP_LABEL',
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
