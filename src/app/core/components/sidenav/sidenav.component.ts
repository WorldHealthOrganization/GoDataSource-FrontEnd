import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/permission.model';
import * as _ from 'lodash';
import { ChildNavItem, NavItem } from './nav-item.class';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { SnackbarService } from '../../services/helper/snackbar.service';

@Component({
    selector: 'app-sidenav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.less']
})
export class SidenavComponent implements OnInit {

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // Nav Item - Account
    accountItem: NavItem = new NavItem(
        'my-account-group',
        '',
        'account',
        [],
        [
            new ChildNavItem(
                'logout',
                'LNG_LAYOUT_MENU_ITEM_LOGOUT_LABEL',
                [],
                '/auth/logout'
            ),
            new ChildNavItem(
                'change-password',
                'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL',
                [],
                '/account/change-password'
            ),
            new ChildNavItem(
                'security-questions',
                'Set Security Questions',
                [],
                '/account/set-security-questions'
            )
        ]
    );

    // Nav Items - main
    mainItems: any[] = [
        new NavItem(
            'admin-group',
            'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL',
            'settings',
            [],
            [
                new ChildNavItem(
                    'system-config',
                    'LNG_LAYOUT_MENU_ITEM_SYSTEM_CONFIG_LABEL',
                    [PERMISSION.READ_SYS_CONFIG],
                    ''
                ),
                new ChildNavItem(
                    'users',
                    'LNG_LAYOUT_MENU_ITEM_USERS_LABEL',
                    [PERMISSION.READ_USER_ACCOUNT],
                    '/users'
                ),
                new ChildNavItem(
                    'teams',
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEAMS_LABEL',
                    [PERMISSION.READ_TEAM],
                    '/users'
                ),
                new ChildNavItem(
                    'roles',
                    'LNG_LAYOUT_MENU_ITEM_ROLES_LABEL',
                    [PERMISSION.READ_ROLE],
                    '/user-roles'
                )
            ]
        ),
        new NavItem(
            'outbreaks-group',
            'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL',
            'bug',
            [],
            [
                new ChildNavItem(
                    'outbreaks',
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL',
                    [PERMISSION.READ_OUTBREAK],
                    '/outbreaks'
                ),
                new ChildNavItem(
                    'outbreak-templates',
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEMPLATES_LABEL',
                    [PERMISSION.READ_OUTBREAK],
                    '/users'
                ),
                new ChildNavItem(
                    'clusters',
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_CLUSTERS_LABEL',
                    [PERMISSION.READ_OUTBREAK],
                    '/users'
                )
            ]
        ),
        new NavItem(
            'dashboard',
            'LNG_LAYOUT_MENU_ITEM_DASHBOARD_LABEL',
            'barChart',
            [],
            [],
            '/dashboard'
        ),
        new NavItem(
            'contacts-group',
            'LNG_LAYOUT_MENU_ITEM_CONTACTS_LABEL',
            'people',
            [],
            [
                new ChildNavItem(
                    'contacts',
                    'LNG_LAYOUT_MENU_ITEM_CONTACTS_LABEL',
                    [PERMISSION.READ_CONTACT],
                    '/contacts',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'contact-follow-ups',
                    'LNG_LAYOUT_MENU_ITEM_CONTACTS_FOLLOW_UPS_LABEL',
                    [
                        PERMISSION.READ_CONTACT,
                        PERMISSION.READ_FOLLOWUP
                    ],
                    '/contacts/follow-ups',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'contact-missed-follow-ups',
                    'LNG_LAYOUT_MENU_ITEM_CONTACTS_MISSED_FOLLOW_UPS_LABEL',
                    [
                        PERMISSION.READ_CONTACT,
                        PERMISSION.READ_FOLLOWUP
                    ],
                    '/contacts/follow-ups/missed',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                )
            ]
        ),
        new NavItem(
            'cases',
            'LNG_LAYOUT_MENU_ITEM_CASES_LABEL',
            'addFolder',
            [PERMISSION.READ_CASE],
            [],
            '/cases',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
            'events',
            'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL',
            'event',
            [PERMISSION.READ_EVENT],
            [],
            '/events',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        // new NavItem(
        //     'duplicated-records',
        //     'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL',
        //     'fileCopy',
        //     // there is a custom logic for this item's permissions (see method 'shouldDisplayItem')
        //     [],
        //     [],
        //     '/users'
        // ),
        new NavItem(
            'transmission-chains',
            'LNG_LAYOUT_MENU_ITEM_TRANSMISSION_CHAINS_LABEL',
            'barChart',
            [],
            [],
            '/transmission-chains',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        {
            separator: true
        },
        new NavItem(
            'reference-data',
            'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL',
            'language',
            [PERMISSION.WRITE_REFERENCE_DATA],
            [],
            '/reference-data'
        )
        // new NavItem(
        //     'help',
        //     'LNG_LAYOUT_MENU_ITEM_HELP_LABEL',
        //     'help',
        //     [],
        //     [],
        //     '/help'
        // )
    ];

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        // retrieve list of outbreaks
        this.outbreakDataService.getOutbreaksList().subscribe((outbreaks) => {
            // no outbreak ?
            if (outbreaks.length < 1) {
                this.snackbarService.showNotice('LNG_GENERIC_WARNING_NO_OUTBREAKS');
            }
        });

        // subscribe to the selected outbreak stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((outbreak: OutbreakModel) => {
                if (outbreak) {
                    // update the selected outbreak
                    this.selectedOutbreak = outbreak;
                }
            });
    }

    /**
     * Check if a Menu Item should be displayed, based on the configured permissions that the authenticated user should have
     */
    shouldDisplayItem(item: NavItem | ChildNavItem) {
        // do we need to check permissions ?
        if (!item.isVisible) {
            return false;
        }

        // check permissions
        switch (item.id) {
            case 'duplicated-records':
                return (
                    this.authUser.hasPermissions(PERMISSION.READ_CASE) ||
                    this.authUser.hasPermissions(PERMISSION.READ_CONTACT)
                );

            default:
                // check if it is an item with a Submenu list
                if (
                    item instanceof NavItem &&
                    (item as NavItem).children &&
                    item.children.length > 0) {
                    // check if there is any visible Child Item
                    return _.filter(item.children, (childItem) => {
                        return childItem.isVisible &&
                            this.authUser.hasPermissions(...childItem.permissions);
                    }).length > 0;
                }

                return this.authUser.hasPermissions(...item.permissions);
        }
    }

    /**
     * Check if we have an outbreak
     * @returns {boolean}
     */
    hasOutbreak(): boolean {
        return this.selectedOutbreak && !_.isEmpty(this.selectedOutbreak.id);
    }

}
