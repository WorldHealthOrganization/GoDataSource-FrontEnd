import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../services/data/auth.data.service';
import { PermissionExpression, UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/permission.model';
import * as _ from 'lodash';
import { ChildNavItem, NavItem } from './nav-item.class';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { SnackbarService } from '../../services/helper/snackbar.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-sidenav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.less']
})
export class SidenavComponent implements OnInit, OnDestroy {

    outbreakSubscriber: Subscription;

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
                'my-profile',
                'LNG_LAYOUT_MENU_ITEM_MY_PROFILE_LABEL',
                [
                    PERMISSION.USER_MODIFY_OWN_ACCOUNT
                ],
                '/account/my-profile'
            ),
            new ChildNavItem(
                'change-password',
                'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL',
                [
                    PERMISSION.USER_MODIFY_OWN_ACCOUNT
                ],
                '/account/change-password'
            ),
            new ChildNavItem(
                'security-questions',
                'LNG_LAYOUT_MENU_ITEM_SET_SECURITY_QUESTION_LABEL',
                [
                    PERMISSION.USER_MODIFY_OWN_ACCOUNT
                ],
                '/account/set-security-questions'
            ),
            new ChildNavItem(
                'saved-filters',
                'LNG_LAYOUT_MENU_ITEM_SAVED_FILTERS_LABEL',
                [PERMISSION.READ_SYS_CONFIG],
                '/saved-filters'
            ),
            new ChildNavItem(
                'saved-import-mapping',
                'LNG_LAYOUT_MENU_ITEM_SAVED_IMPORT_MAPPING_LABEL',
                [],
                '/saved-import-mapping'
            ),
            new ChildNavItem(
                'cloud-backup',
                'LNG_LAYOUT_MENU_ITEM_CLOUD_BACKUP_LABEL',
                [PERMISSION.READ_SYS_CONFIG],
                '/cloud-backup'
            ),
            new ChildNavItem(
                'terms-of-use',
                'LNG_LAYOUT_MENU_ITEM_TERMS_OF_USE_LABEL',
                [],
                '/terms-of-use'
            ),
            new ChildNavItem(
                'version',
                'LNG_LAYOUT_MENU_ITEM_VERSION_LABEL',
                [],
                '/version'
            )
        ]
    );

    // Nav Items - main
    mainItems: any[] = [
        new NavItem(
            'dashboard',
            'LNG_LAYOUT_MENU_ITEM_DASHBOARD_LABEL',
            'barChart',
            [],
            [],
            '/dashboard'
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
                    [
                        PERMISSION.OUTBREAK_LIST
                    ],
                    '/outbreaks'
                ),
                new ChildNavItem(
                    'outbreak-templates',
                    'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEMPLATES_LABEL',
                    [
                        PERMISSION.OUTBREAK_TEMPLATE_LIST
                    ],
                    '/outbreak-templates'
                )
            ]
        ),
        new NavItem(
            'cases',
            'LNG_LAYOUT_MENU_ITEM_CASES_LABEL',
            'addFolder',
            [
                PERMISSION.CASE_LIST
            ],
            [],
            '/cases',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
            `lab-results-group`,
            'LNG_LAYOUT_MENU_ITEM_LAB_RESULTS_LABEL',
            'lab',
            [],
            [
                new ChildNavItem(
                    'lab-results',
                    'LNG_LAYOUT_MENU_ITEM_LAB_RESULTS_LABEL',
                    [
                        PERMISSION.CASE_LAB_RESULT_LIST
                    ],
                    '/cases/lab-results',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'gantt-chart',
                    'LNG_LAYOUT_MENU_ITEM_GANTT_CHART',
                    new PermissionExpression({
                        or: [
                            PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_LAB_TESTING,
                            PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_HOSPITALIZATION
                        ]
                    }),
                    '/cases/gantt-chart',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                )
            ]
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
                    [
                        PERMISSION.CONTACT_LIST
                    ],
                    '/contacts',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'contact-follow-ups',
                    'LNG_LAYOUT_MENU_ITEM_CONTACTS_FOLLOW_UPS_LABEL',
                    [
                        PERMISSION.FOLLOW_UP_LIST
                    ],
                    '/contacts/follow-ups',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'contact-range-follow-ups',
                    'LNG_LAYOUT_MENU_ITEM_CONTACTS_RANGE_FOLLOW_UPS_LABEL',
                    [
                        PERMISSION.FOLLOW_UP_LIST_RANGE
                    ],
                    '/contacts/range-follow-ups',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                )
            ]
        ),
        new NavItem(
            'events',
            'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL',
            'event',
            [
                PERMISSION.OUTBREAK_VIEW,
                PERMISSION.EVENT_LIST
            ],
            [],
            '/events',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
            'duplicated-records',
            'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL',
            'fileCopy',
            [
                PERMISSION.DUPLICATE_LIST
            ],
            [],
            '/duplicated-records',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
            'clusters',
            'LNG_LAYOUT_MENU_ITEM_CLUSTERS_LABEL',
            'groupWork',
            [
                PERMISSION.CLUSTER_LIST
            ],
            [],
            '/clusters',
            () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
            'data-visualisation',
            'LNG_LAYOUT_MENU_ITEM_DATA_VISUALISATION',
            'barChart',
            [],
            [
                new ChildNavItem(
                    'transmission-chains',
                    'LNG_LAYOUT_MENU_ITEM_TRANSMISSION_CHAINS_LABEL',
                    new PermissionExpression({
                        or: [
                            PERMISSION.COT_VIEW_BUBBLE_NETWORK,
                            PERMISSION.COT_VIEW_GEOSPATIAL_MAP,
                            PERMISSION.COT_VIEW_HIERARCHICAL_NETWORK,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_ONSET,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_REPORTING
                        ]
                    }),
                    '/transmission-chains',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'transmission-chain-bars',
                    'LNG_LAYOUT_MENU_ITEM_TRANSMISSION_CHAIN_BARS_LABEL',
                    [
                        PERMISSION.COT_VIEW_BAR_CHART
                    ],
                    '/graphs/transmission-chain-bars',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'transmission-chains-list',
                    'LNG_LAYOUT_MENU_ITEM_TRANSMISSION_CHAINS_LIST_LABEL',
                    [
                        PERMISSION.COT_LIST
                    ],
                    '/transmission-chains/list',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
                new ChildNavItem(
                    'cases-count-map',
                    'LNG_LAYOUT_MENU_ITEM_TRANSMISSION_CHAINS_COUNT_MAP_LABEL',
                    [
                        PERMISSION.COT_VIEW_CASE_COUNT_MAP
                    ],
                    '/transmission-chains/case-count-map',
                    () => this.hasOutbreak.apply(this) // provide context to keep this functionality
                ),
            ]
        ),
        {
            separator: true
        },
        new NavItem(
            'help',
            'LNG_LAYOUT_MENU_ITEM_HELP',
            'help',
            [
                // NO permissions required, only to be authenticated
            ],
            [],
            '/help'
        ),
        new NavItem(
            'reference-data',
            'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL',
            'language',
            [
                PERMISSION.REFERENCE_DATA_LIST
            ],
            [],
            '/reference-data'
        ),
        new NavItem(
            'locations',
            'LNG_LAYOUT_MENU_ITEM_LOCATIONS_LABEL',
            'location',
            [
                PERMISSION.LOCATION_LIST
            ],
            [],
            '/locations'
        ),
        new NavItem(
            'admin-group',
            'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL',
            'supervisor',
            [],
            [
                new ChildNavItem(
                    'users',
                    'LNG_LAYOUT_MENU_ITEM_USERS_LABEL',
                    [
                        PERMISSION.USER_LIST
                    ],
                    '/users'
                ),
                new ChildNavItem(
                    'roles',
                    'LNG_LAYOUT_MENU_ITEM_ROLES_LABEL',
                    [
                        PERMISSION.USER_ROLE_LIST
                    ],
                    '/user-roles'
                ),
                new ChildNavItem(
                    'languages',
                    'LNG_LAYOUT_MENU_ITEM_LANGUAGES',
                    [
                        PERMISSION.LANGUAGE_LIST
                    ],
                    '/languages'
                ),
                new ChildNavItem(
                    'audit-log',
                    'LNG_LAYOUT_MENU_ITEM_AUDIT_LOG_LABEL',
                    [
                        PERMISSION.AUDIT_LOG_LIST
                    ],
                    '/audit-log'
                ),
                new ChildNavItem(
                    'teams',
                    'LNG_LAYOUT_MENU_ITEM_TEAMS_ASSIGNMENTS_LABEL',
                    [
                        PERMISSION.TEAM_LIST
                    ],
                    '/teams'
                ),
                new ChildNavItem(
                    'help-admin',
                    'LNG_LAYOUT_MENU_ITEM_HELP_ADMIN',
                    [
                        PERMISSION.HELP_CATEGORY_LIST
                    ],
                    '/help/categories'
                )
            ]
        ),
        new NavItem(
            'system-config',
            'LNG_LAYOUT_MENU_ITEM_SYSTEM_CONFIG_LABEL',
            'settings',
            [],
            [
                new ChildNavItem(
                    'upstream-servers',
                    'LNG_LAYOUT_MENU_ITEM_UPSTREAM_SERVERS_LABEL',
                    [
                        PERMISSION.UPSTREAM_SERVER_LIST
                    ],
                    '/system-config/upstream-servers'
                ),
                new ChildNavItem(
                    'client-applications',
                    'LNG_LAYOUT_MENU_ITEM_CLIENT_APPLICATIONS_LABEL',
                    [
                        PERMISSION.CLIENT_APPLICATION_LIST
                    ],
                    '/system-config/client-applications'
                ),
                new ChildNavItem(
                    'devices',
                    'LNG_LAYOUT_MENU_ITEM_DEVICES_LABEL',
                    [
                        PERMISSION.DEVICE_LIST
                    ],
                    '/system-config/devices'
                ),
                new ChildNavItem(
                    'sync',
                    'LNG_LAYOUT_MENU_ITEM_SYNC_LABEL',
                    [
                        PERMISSION.SYNC_LOG_LIST
                    ],
                    '/system-config/sync-logs'
                ),
                new ChildNavItem(
                    'backups',
                    'LNG_LAYOUT_MENU_ITEM_BACKUPS_LABEL',
                    [
                        PERMISSION.BACKUP_LIST
                    ],
                    '/system-config/backups'
                )
            ]
        ),
    ];

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // retrieve list of outbreaks
        if (OutbreakModel.canView(this.authUser)) {
            this.outbreakDataService
                .getOutbreaksCount()
                .subscribe((outbreaksCount) => {
                    // no outbreak ?
                    if (!outbreaksCount.count) {
                        this.snackbarService.showNotice('LNG_GENERIC_WARNING_NO_OUTBREAKS');
                    }
                });
        }

        // subscribe to the selected outbreak stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((outbreak: OutbreakModel) => {
                if (outbreak) {
                    // update the selected outbreak
                    this.selectedOutbreak = outbreak;
                }
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Check if a Menu Item should be displayed, based on the configured permissions that the authenticated user should have
     */
    shouldDisplayItem(item: NavItem | ChildNavItem) {
        // do we need to check permissions ?
        if (!item.isVisible) {
            return false;
        }

        // check if this an expandable menu
        if (
            item instanceof NavItem &&
            (item as NavItem).children &&
            item.children.length > 0
        ) {
            // check if there is at least one visible child
            return !!_.find(item.children, (childItem) => {
                return childItem.isVisible &&
                    (
                        _.isArray(childItem.permissions) ?
                            this.authUser.hasPermissions(...childItem.permissions) :
                            this.authUser.hasPermissions(...[childItem.permissions])
                    );
            });
        }

        // check parent permissions
        return _.isArray(item.permissions) ?
            this.authUser.hasPermissions(...item.permissions) :
            this.authUser.hasPermissions(...[item.permissions]);
    }

    /**
     * Check if we have an outbreak
     * @returns {boolean}
     */
    hasOutbreak(): boolean {
        return this.selectedOutbreak && !_.isEmpty(this.selectedOutbreak.id);
    }

}
