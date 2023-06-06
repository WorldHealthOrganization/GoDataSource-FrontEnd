import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { AuthDataService } from '../../services/data/auth.data.service';
import { PermissionExpression, UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/permission.model';
import { ChildNavItem, NavItem } from './nav-item.class';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { DashboardModel } from '../../models/dashboard.model';
import { SystemSettingsDataService } from '../../services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';
import { IsActiveMatchOptions } from '@angular/router';
import { ToastV2Service } from '../../services/helper/toast-v2.service';
import { MAT_MENU_DEFAULT_OPTIONS, MatMenuTrigger } from '@angular/material/menu';
import { determineIfTouchDevice } from '../../methods/touch-device';
import { I18nService } from '../../services/helper/i18n.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  providers: [{
    provide: MAT_MENU_DEFAULT_OPTIONS,
    useValue: {
      overlayPanelClass: 'gd-cdk-overlay-pane-main-menu'
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent implements OnInit, OnDestroy {
  // expanded / collapsed mode
  @Input() expanded: boolean = false;

  // current active main menu
  private _activeMainMenuId: string;
  private _menuPositionTimer: number;
  private _menuCloseTimer: number;

  // check if this is a touch device
  isTouchDevice: boolean = determineIfTouchDevice();

  // subscriptions
  outbreakSubscriber: Subscription;

  // language handler
  languageSubscription: Subscription;

  // authenticated user
  authUser: UserModel;

  // selected Outbreak
  selectedOutbreak: OutbreakModel;

  // version information
  versionData: SystemSettingsVersionModel;

  // active setup
  activeSetup: IsActiveMatchOptions = {
    matrixParams: 'exact',
    queryParams: 'ignored',
    paths: 'exact',
    fragment: 'exact'
  };

  // Menu groups
  menuGroups: {
    label: string,
    visible: boolean,
    options: NavItem[]
  }[] = [{
      label: 'LNG_LAYOUT_MENU_DATA_LABEL',
      visible: false,
      options: [
        new NavItem(
          'dashboard',
          'LNG_LAYOUT_MENU_ITEM_DASHBOARD_LABEL',
          'grid_view',
          DashboardModel.canViewDashboard,
          [],
          '/dashboard'
        ),
        new NavItem(
          'outbreaks-group',
          'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL',
          'bug_report',
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
          'person',
          [
            PERMISSION.CASE_LIST
          ],
          [],
          '/cases',
          () => this.hasOutbreak.apply(this) // provide context to keep this functionality
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
              'contacts-of-contacts',
              'LNG_LAYOUT_MENU_ITEM_CONTACTS_OF_CONTACTS_LABEL',
              [
                PERMISSION.CONTACT_OF_CONTACT_LIST
              ],
              '/contacts-of-contacts',
              () => this.hasOutbreakAndCoCEnabled.apply(this) // provide context to keep this functionality
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
          'lab-results-group',
          'LNG_LAYOUT_MENU_ITEM_LAB_RESULTS_LABEL',
          'science',
          [],
          [
            new ChildNavItem(
              'lab-results',
              'LNG_LAYOUT_MENU_ITEM_LAB_RESULTS_LABEL',
              new PermissionExpression({
                and: [
                  PERMISSION.LAB_RESULT_LIST,
                  new PermissionExpression({
                    or: [
                      PERMISSION.CASE_LIST_LAB_RESULT,
                      PERMISSION.CONTACT_LIST_LAB_RESULT
                    ]
                  })
                ]
              }),
              '/lab-results',
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
              '/lab-results/gantt-chart',
              () => this.hasOutbreak.apply(this) // provide context to keep this functionality
            )
          ]
        ),
        new NavItem(
          'events',
          'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL',
          'event_note',
          [
            PERMISSION.OUTBREAK_VIEW,
            PERMISSION.EVENT_LIST
          ],
          [],
          '/events',
          () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
          'clusters',
          'LNG_LAYOUT_MENU_ITEM_CLUSTERS_LABEL',
          'group_work',
          [
            PERMISSION.CLUSTER_LIST
          ],
          [],
          '/clusters',
          () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
          'duplicated-records',
          'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL',
          'repeat',
          [
            PERMISSION.DUPLICATE_LIST
          ],
          [],
          '/duplicated-records',
          () => this.hasOutbreak.apply(this) // provide context to keep this functionality
        ),
        new NavItem(
          'data-visualisation',
          'LNG_LAYOUT_MENU_ITEM_DATA_VISUALISATION',
          'insert_chart_outlined',
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
            )
          ]
        )
      ]
    }, {
      label: 'LNG_LAYOUT_MENU_SYSTEM_ADMINISTRATION_LABEL',
      visible: false,
      options: [
        new NavItem(
          'reference-data',
          'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL',
          'format_list_bulleted',
          [
            PERMISSION.REFERENCE_DATA_LIST
          ],
          [],
          '/reference-data'
        ),
        new NavItem(
          'locations',
          'LNG_LAYOUT_MENU_ITEM_LOCATIONS_LABEL',
          'location_on',
          [
            PERMISSION.LOCATION_LIST
          ],
          [],
          '/locations'
        ),
        new NavItem(
          'admin-group',
          'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL',
          'supervised_user_circle',
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
            ),
            new ChildNavItem(
              'cloud-backup',
              'LNG_LAYOUT_MENU_ITEM_CLOUD_BACKUP_LABEL',
              [
                PERMISSION.BACKUP_VIEW_CLOUD_BACKUP
              ],
              '/cloud-backup'
            )
          ]
        ),
        new NavItem(
          'help',
          'LNG_LAYOUT_MENU_ITEM_HELP',
          'help',
          [
            // NO permissions required, only to be authenticated
          ],
          [],
          '/help'
        )
      ]
    }];

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private systemSettingsDataService: SystemSettingsDataService,
    private changeDetectorRef: ChangeDetectorRef,
    private i18nService: I18nService
  ) {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // retrieve list of outbreaks
    if (OutbreakModel.canView(this.authUser)) {
      this.outbreakDataService
        .getOutbreaksCount()
        .subscribe((outbreaksCount) => {
          // no outbreak ?
          if (!outbreaksCount.count) {
            this.toastV2Service.notice('LNG_GENERIC_WARNING_NO_OUTBREAKS');
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

          // update menu visibility
          this.updateMenuVisibility();
        }
      });

    // retrieve version data
    this.systemSettingsDataService
      .getAPIVersion()
      .subscribe((versionData) => {
        // set data version
        this.versionData = versionData;

        // update ui
        this.changeDetectorRef.detectChanges();
      });

    // update menu visibility
    this.updateMenuVisibility();

    // subscribe to language change
    this.initializeLanguageChangeListener();
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }

    // stop position timer
    this.stopPositionTimer();

    // stop close main menus
    if (this._menuCloseTimer) {
      clearTimeout(this._menuCloseTimer);
      this._menuCloseTimer = undefined;
    }

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
  }

  /**
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // update ui
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
    }
  }

  /**
   * Check if a Menu Item should be displayed, based on the configured permissions that the authenticated user should have
   */
  private updateMenuVisibility(): void {
    // go through menu option and set visibility
    this.menuGroups.forEach((menu) => {
      // group visible ?
      let groupVisible: boolean = false;

      // update visibility for children
      menu.options.forEach((menuOption) => {
        // check if this an expandable menu
        let hasPermission: boolean = false;
        if (
          (menuOption as NavItem).children &&
          menuOption.children.length > 0
        ) {
          // make children visible
          // & check if there is at least one child visible to make parent visible
          menuOption.children.forEach((childItem) => {
            // determine child visibility
            childItem.visible = Array.isArray(childItem.permissions) ?
              this.authUser.hasPermissions(...childItem.permissions) :
              this.authUser.hasPermissions(...[childItem.permissions]);

            // do we have additional checks?
            childItem.visible = childItem.visible && (
              !childItem.additionalVisibilityCheck ||
              childItem.additionalVisibilityCheck()
            );

            // make parent visible ?
            if (childItem.visible) {
              hasPermission = true;
            }
          });
        } else {
          // check parent permissions
          hasPermission = Array.isArray(menuOption.permissions) ?
            this.authUser.hasPermissions(...menuOption.permissions) :
            this.authUser.hasPermissions(...[menuOption.permissions]);

          // do we have additional checks?
          hasPermission = hasPermission && (
            !menuOption.additionalVisibilityCheck ||
            menuOption.additionalVisibilityCheck()
          );
        }

        // set visibility
        menuOption.visible = hasPermission;

        // update group visibility
        if (menuOption.visible) {
          groupVisible = true;
        }
      });

      // update group visibility
      menu.visible = groupVisible;
    });

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Check if we have an outbreak
   */
  private hasOutbreak(): boolean {
    return !!(this.selectedOutbreak && this.selectedOutbreak.id);
  }

  /**
   * Check if we have an outbreak and if contacts of contacts is enabled
   */
  private hasOutbreakAndCoCEnabled(): boolean {
    return this.hasOutbreak() &&
      this.selectedOutbreak.isContactsOfContactsActive;
  }

  /**
   * Clear position timer
   */
  private stopPositionTimer(): void {
    if (this._menuPositionTimer) {
      clearTimeout(this._menuPositionTimer);
      this._menuPositionTimer = undefined;
    }
  }

  /**
   * Main menu opened
   */
  mainMenuOpened(
    navItem: NavItem,
    trigger: MatMenuTrigger
  ): void {
    // menu opened
    this._activeMainMenuId = navItem.id;
    navItem.menuOpenedTrigger = trigger;

    // close all main menus except the active one
    this.checkAndCloseMenusImmediate();

    // retrieve parent element
    const menuClassList: any = document.querySelector(`.gd-main-menu-option-float-menu.${navItem.id}`);
    const overlayClassList: any = menuClassList ?
      menuClassList.closest('.cdk-overlay-pane').classList :
      menuClassList;

    // stop previous
    this.stopPositionTimer();

    // make position adjustments
    this._menuPositionTimer = setTimeout(() => {
      // clear
      this._menuPositionTimer = undefined;

      // attach class
      if (
        menuClassList &&
        menuClassList.classList
      ) {
        if (menuClassList.classList.contains('mat-menu-above')) {
          if (
            overlayClassList &&
            !overlayClassList.contains('gd-cdk-overlay-pane-main-menu-above')
          ) {
            overlayClassList.add('gd-cdk-overlay-pane-main-menu-above');
          }
        } else if (
          overlayClassList &&
          overlayClassList.contains('gd-cdk-overlay-pane-main-menu-above')
        ) {
          overlayClassList.remove('gd-cdk-overlay-pane-main-menu-above');
        }
      }
    });
  }

  /**
   * Main menu opened
   */
  mainMenuClosed(navItem: NavItem): void {
    // menu closed
    navItem.menuOpenedTrigger = undefined;

    // clear active menu ?
    if (this._activeMainMenuId === navItem.id) {
      // clear
      this._activeMainMenuId = undefined;

      // stop position timer
      this.stopPositionTimer();
    }
  }

  /**
   * Floating menu enter
   */
  floatingMenuEnter(navItem: NavItem): void {
    // make active
    this._activeMainMenuId = navItem.id;
  }

  /**
   * Floating menu leave
   */
  floatingMenuLeave(navItem: NavItem): void {
    // clear active menu ?
    if (this._activeMainMenuId === navItem.id) {
      this._activeMainMenuId = undefined;
    }

    // check and close menus
    this.checkAndCloseMenus();
  }

  /**
   * Menu option enter
   */
  menuOptionEnter(
    navItem: NavItem,
    trigger: MatMenuTrigger
  ): void {
    // make active
    this._activeMainMenuId = navItem.id;

    // open menu
    if (!trigger.menuOpen) {
      trigger.openMenu();
    }
  }

  /**
   * Menu option leave
   */
  menuOptionLeave(navItem: NavItem): void {
    // clear active menu ?
    if (this._activeMainMenuId === navItem.id) {
      this._activeMainMenuId = undefined;
    }

    // check and close menus
    this.checkAndCloseMenus();
  }

  /**
   * Close main menu - now!!!
   */
  private checkAndCloseMenusImmediate(): void {
    // go through menu options
    this.menuGroups.forEach((menuGroup) => {
      // nothing to do ?
      // - we need to check even if it became npt visible since the menu could be visible before it became..
      if (!menuGroup.options?.length) {
        return;
      }

      // go through options
      menuGroup.options.forEach((menuOption) => {
        // nothing to do ?
        if (!menuOption.menuOpenedTrigger?.menuOpen) {
          return;
        }

        // close menu if not active
        if (menuOption.id !== this._activeMainMenuId) {
          menuOption.menuOpenedTrigger.closeMenu();
        }
      });
    });
  }

  /**
   * Check and close main menus
   */
  private checkAndCloseMenus(): void {
    // already in progress ?
    if (this._menuCloseTimer) {
      // wait to execute
      return;
    }

    // menu cleanup
    this._menuCloseTimer = setTimeout(() => {
      // executed
      this._menuCloseTimer = undefined;

      // close all main menus except the active one
      this.checkAndCloseMenusImmediate();
    }, 50);
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  updateMargins(): void {
    // update
    this.changeDetectorRef.detectChanges();
  }
}
