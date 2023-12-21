import * as _ from 'lodash';
import { IPermissionChildModel, PERMISSION, PermissionModel } from './permission.model';
import { SecurityQuestionModel } from './securityQuestion.model';
import { UserSettingsDashboardModel } from './user-settings-dashboard.model';
import { IPermissionBasic, IPermissionBasicBulk, IPermissionCloneable, IPermissionUser } from './permission.interface';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { TeamModel } from './team.model';
import { BaseModel } from './base.model';
import { Moment } from '../helperClasses/localization-helper';

export enum UserSettings {
  // fields
  AUDIT_LOG_FIELDS = 'auditLogFields',
  DASHBOARD = 'dashboard',
  CASE_FIELDS = 'caseFields',
  CASE_LAB_FIELDS = 'caseLabFields',
  CASE_WITHOUT_RELATIONSHIPS_FIELDS = 'caseWithoutRelationshipsFields',
  CONTACT_LAB_FIELDS = 'contactLabFields',
  CONTACT_FIELDS = 'contactFields',
  CONTACT_OF_CONTACT_FIELDS = 'contactOfContactFields',
  CONTACT_OF_CONTACT_LAB_FIELDS = 'contactOfContactLabFields',
  EVENT_FIELDS = 'eventFields',
  EVENT_WITHOUT_RELATIONSHIPS_FIELDS = 'eventWithoutRelationshipsFields',
  LOCATION_FIELDS = 'locationFields',
  LOCATION_USAGE_FIELDS = 'locationUsageFields',
  LAB_RESULTS_FIELDS = 'labResults',
  RELATIONSHIP_FIELDS = 'relationshipFields',
  OUTBREAK_FIELDS = 'outbreakFields',
  OUTBREAK_MODIFY_QUESTIONNAIRE_FIELDS = 'outbreakModifyQuestionnaireFields',
  OUTBREAK_TEMPLATE_FIELDS = 'outbreakTemplateFields',
  OUTBREAK_TEMPLATE_MODIFY_QUESTIONNAIRE_FIELDS = 'outbreakTemplateModifyQuestionnaireFields',
  CONTACT_DAILY_FOLLOW_UP_FIELDS = 'contactDailyFollowUpFields',
  CASE_RELATED_DAILY_FOLLOW_UP_FIELDS = 'caseRelatedFollowUpFields',
  CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = 'contactRelatedFollowUpFields',
  CONTACT_OF_CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = 'contactOfContactRelatedFollowUpFields',
  SYNC_UPSTREAM_SERVERS_FIELDS = 'syncUpstreamServersFields',
  SYNC_CLIENT_APPLICATIONS_FIELDS = 'syncClientApplicationsFields',
  SYNC_LOGS_FIELDS = 'syncLogsFields',
  REF_DATA_CAT_FIELDS = 'refDataCategoriesFields',
  REF_DATA_CAT_ENTRIES_FIELDS = 'refDataCatEntriesFields',
  SHARE_RELATIONSHIPS = 'shareRelationships',
  ADD_RELATIONSHIPS = 'addRelationships',
  SWITCH_RELATIONSHIP_FIELDS = 'switchRelationshipsFields',
  USER_ROLE_FIELDS = 'userRoleFields',
  ENTITY_NOT_DUPLICATES_FIELDS = 'entityNotDuplicatesFields',
  USER_FIELDS = 'userFields',
  TEAM_FIELDS = 'teamFields',
  COT_SNAPSHOT_FIELDS = 'cotSnapshotFields',
  SEARCH_RESULTS_FIELDS = 'searchResultsFields',
  HELP_CATEGORIES_LIST = 'helpCategoriesList',
  HELP_SEARCH = 'helpSearch',
  HELP_ITEMS_LIST = 'helpItemsList',
  BACKUP_FIELDS = 'backupFields',
  CLUSTER_FIELDS = 'clusterFields',
  ONSET_FIELDS = 'onsetFields',
  LONG_ONSET_FIELDS = 'longOnsetFields',
  SAVED_FILTER_FIELDS = 'savedFilterFields',
  SAVED_IMPORT_MAPPING_FIELDS = 'savedImportMappingFields',
  OUTBREAK_INCONSISTENCIES_FIELDS = 'outbreakInconsistenciesFields',
  COT_FIELDS = 'cotFields',
  DEVICES_FIELDS = 'devicesFields',
  ICON_FIELDS = 'iconFields',
  VIEW_PEOPLE_FIELDS = 'viewPeopleFields',
  LANGUAGE_FIELDS = 'languageFields',
  AVAILABLE_ENTITIES_FIELDS = 'availableEntitiesFields',
  FOLLOW_UP_DASHBOARD_FIELDS = 'followUpDashboardFields',

  // general settings
  CASE_GENERAL = 'caseGeneral',
  EVENT_GENERAL = 'eventGeneral',
  CONTACT_GENERAL = 'contactGeneral',
  CONTACT_OF_CONTACTS_GENERAL = 'contactOfContactsGeneral',
  LAB_RESULT_GENERAL = 'labResultGeneral',
  FOLLOW_UP_GENERAL = 'followUpGeneral'
}

export enum PhoneNumberType {
  PRIMARY_PHONE_NUMBER = 'LNG_USER_FIELD_LABEL_PRIMARY_TELEPHONE'
}

export interface IPermissionExpressionAnd {
  and: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[];
}

export interface IPermissionExpressionOr {
  or: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[];
}

export class PermissionExpression {
  /**
     * Constructor
     */
  constructor(
    public permission: PERMISSION |
    IPermissionExpressionAnd |
    IPermissionExpressionOr |
    ((UserModel) => boolean)
  ) {}

  /**
     * Check if an user passes required permissions from this model
     * @param authUser
     */
  allowed(authUser: UserModel): boolean {
    // check recursively if we have access
    if (typeof this.permission === 'object') {
      // and / or conditions
      if ((this.permission as any).and !== undefined) {
        // go through and see if all conditions match
        const permission: IPermissionExpressionAnd = this.permission as IPermissionExpressionAnd;
        for (const condition of permission.and) {
          // if complex expression then we need to check further
          if (condition instanceof PermissionExpression) {
            if (!condition.allowed(authUser)) {
              return false;
            }

            // check if condition is function
          } else if (typeof condition === 'function') {
            if (!condition(authUser)) {
              return false;
            }

            // check if user has this permission
          } else if (!authUser.permissionIdsMapped[condition]) {
            return false;
          }
        }

        // all match
        return true;
      } else if ((this.permission as any).or !== undefined) {
        // go through and see if at least one condition matches
        const permission: IPermissionExpressionOr = this.permission as IPermissionExpressionOr;
        for (const condition of permission.or) {
          // if complex expression then we need to check further
          if (condition instanceof PermissionExpression) {
            if (condition.allowed(authUser)) {
              return true;
            }

            // check if condition is function
          } else if (typeof condition === 'function') {
            if (condition(authUser)) {
              return true;
            }

            // check if user has this permission
          } else if (authUser.permissionIdsMapped[condition]) {
            return true;
          }
        }

        // no match ?
        return false;
      }

      // invalid object
      return false;
    }

    // simple permission
    return typeof this.permission === 'function' ?
      this.permission(authUser) :
      !!authUser.permissionIdsMapped[this.permission];
  }
}

export class UserRoleModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionCloneable {
  id: string | null;
  name: string | null;
  permissionIds: PERMISSION[];
  description: string | null;
  permissions: IPermissionChildModel[];

  users: UserModel[];

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    options: {
      createdOn: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      permission: PermissionModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_USER_ROLE_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'users._id',
        label: 'LNG_USER_ROLE_FIELD_LABEL_USERS',
        options: data.options.user
      },
      {
        type: V2AdvancedFilterType.SELECT_GROUPS,
        field: 'permissionIds',
        label: 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS',
        groups: data.options.permission,
        groupLabelKey: 'groupLabel',
        groupTooltipKey: 'groupDescription',
        groupValueKey: 'groupAllId',
        groupOptionsKey: 'permissions',
        groupOptionLabelKey: 'label',
        groupOptionValueKey: 'id',
        groupOptionTooltipKey: 'description',
        groupAllLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_ALL',
        groupAllTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_ALL_DESCRIPTION',
        groupNoneLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_NONE',
        groupNoneTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_NONE_DESCRIPTION',
        groupPartialLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_PARTIAL',
        groupPartialTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_PARTIAL_DESCRIPTION',
        groupOptionHiddenKey: 'hidden',
        defaultValues: PermissionModel.HIDDEN_PERMISSIONS
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdOn',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_ON',
        options: data.options.createdOn,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      }
    ];

    // finished
    return advancedFilters;
  }


  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_VIEW, PERMISSION.USER_ROLE_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_DELETE) : false; }

  /**
     * Static Permissions - IPermissionCloneable
     */
  static canClone(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_CREATE_CLONE) : false; }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_EXPORT) : false; }

  /**
   * Static Permissions - IPermissionImportable
   */
  static canImport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_IMPORT) : false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    // parent
    super(data);

    // data
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.permissionIds = _.get(data, 'permissionIds', []);
    this.description = _.get(data, 'description');

    this.users = _.get(data, 'users', [])
      .map((userData) => {
        return new UserModel(userData);
      });
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return UserRoleModel.canView(user); }
  canList(user: UserModel): boolean { return UserRoleModel.canList(user); }
  canCreate(user: UserModel): boolean { return UserRoleModel.canCreate(user); }
  canModify(user: UserModel): boolean { return UserRoleModel.canModify(user); }
  canDelete(user: UserModel): boolean { return UserRoleModel.canDelete(user); }

  /**
     * Permissions - IPermissionCloneable
     */
  canClone(user: UserModel): boolean { return UserRoleModel.canClone(user); }

  /**
   * Permissions - IPermissionExportable
   */
  canExport(user: UserModel): boolean { return UserRoleModel.canExport(user); }

  /**
   * Permissions - IPermissionImportable
   */
  canImport(user: UserModel): boolean { return UserRoleModel.canImport(user); }
}

export class UserModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionBasicBulk,
    IPermissionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordChange: boolean;
  outbreakIds: string[];
  activeOutbreakId: string;
  languageId: string;
  roleIds: string[];
  roles: UserRoleModel[] = [];
  disregardGeographicRestrictions: boolean;
  lastLogin: string | Moment;

  // no saved filters to be used by this user ?
  dontCacheFilters: boolean;

  // used to determine if permissions changed from last time we used this key
  private _permissionIdsHash: number;
  get permissionIdsHash(): number {
    return this._permissionIdsHash;
  }

  // list of permissions for current user
  private _permissionIds: PERMISSION[] = [];
  permissionIdsMapped: {
    [permissionId: string]: boolean
  } = {};
  set permissionIds(permissionIds: PERMISSION[]) {
    // user permissions
    this._permissionIds = permissionIds;

    // user permissions for easy access
    this._permissionIdsHash = 0;
    this.permissionIdsMapped = _.transform(permissionIds, (a, v) => {
      // map
      a[v] = true;

      // concatenate to determine hash later
      for (let i = 0; i < v.length; i++) {
        const char = v.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        this._permissionIdsHash = ((this._permissionIdsHash << 5) - this._permissionIdsHash) + char;
      }
    }, {});
  }
  get permissionIds(): PERMISSION[] {
    return this._permissionIds;
  }

  securityQuestions: SecurityQuestionModel[] = [];
  settings: { [key: string]: any } = {};
  institutionName: string;
  telephoneNumbers: {
    [key: string]: string
  };

  availablePermissions: PermissionModel[];

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    authUser: UserModel,
    options: {
      createdOn: ILabelValuePairModel[],
      institution: ILabelValuePairModel[],
      userRole: ILabelValuePairModel[],
      outbreak: ILabelValuePairModel[],
      team: ILabelValuePairModel[],
      language: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // User
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_USER_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_USER_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'email',
        label: 'LNG_USER_FIELD_LABEL_EMAIL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'institutionName',
        label: 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME',
        options: data.options.institution,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.PHONE_NUMBER,
        field: `telephoneNumbers.${PhoneNumberType.PRIMARY_PHONE_NUMBER}`,
        label: 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'roleIds',
        label: 'LNG_USER_FIELD_LABEL_ROLES',
        options: data.options.userRole
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'activeOutbreakId',
        label: 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK',
        options: data.options.outbreak,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'outbreakIds',
        label: 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS',
        options: data.options.outbreak
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'languageId',
        label: 'LNG_USER_FIELD_LABEL_LANGUAGE',
        options: data.options.language,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'disregardGeographicRestrictions',
        label: 'LNG_USER_FIELD_LABEL_DISREGARD_GEOGRAPHIC_RESTRICTIONS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'dontCacheFilters',
        label: 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'lastLogin',
        label: 'LNG_USER_FIELD_LABEL_LAST_LOGIN',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdOn',
        label: 'LNG_USER_FIELD_LABEL_CREATED_ON',
        options: data.options.createdOn,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_USER_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_USER_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_USER_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_USER_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      }
    ];

    // can see teams ?
    if (TeamModel.canList(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'teams',
        label: 'LNG_USER_FIELD_LABEL_TEAMS',
        options: data.options.team
      });
    }

    // finished
    return advancedFilters;
  }

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_VIEW, PERMISSION.USER_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_DELETE) : false; }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(): boolean { return false; }
  static canBulkModify(): boolean { return false; }
  static canBulkDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_BULK_DELETE) : false; }
  static canBulkRestore(): boolean { return false; }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_EXPORT) : false; }

  /**
   * Static Permissions - IPermissionImportable
   */
  static canImport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_IMPORT) : false; }

  /**
     * Static Permissions - IPermissionUser
     */
  static canModifyOwnAccount(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_MODIFY_OWN_ACCOUNT) : false; }
  static canListForFilters(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_LIST_FOR_FILTERS) : false; }
  static canListWorkload(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_LIST_WORKLOAD) : false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    // parent
    super(data);

    this.id = _.get(data, 'id');
    this.firstName = _.get(data, 'firstName');
    this.lastName = _.get(data, 'lastName');
    this.email = _.get(data, 'email');
    this.password = _.get(data, 'password');
    this.passwordChange = _.get(data, 'passwordChange', false);
    this.outbreakIds = _.get(data, 'outbreakIds', []);
    this.activeOutbreakId = _.get(data, 'activeOutbreakId');
    this.languageId = _.get(data, 'languageId');
    this.roleIds = _.get(data, 'roleIds', []);
    this.securityQuestions = _.get(data, 'securityQuestions', [new SecurityQuestionModel(), new SecurityQuestionModel()]);
    this.availablePermissions = _.get(data, 'availablePermissions');
    this.institutionName = _.get(data, 'institutionName');
    this.telephoneNumbers = _.get(data, 'telephoneNumbers', {});
    this.disregardGeographicRestrictions = _.get(data, 'disregardGeographicRestrictions', false);
    this.dontCacheFilters = _.get(data, 'dontCacheFilters', false);
    this.lastLogin = _.get(data, 'lastLogin');

    // initialize settings
    _.each(data?.settings, (settings, property) => {
      // initialize settings
      if (property === UserSettings.DASHBOARD) {
        this.settings[property] = new UserSettingsDashboardModel(settings);
      } else {
        this.settings[property] = settings;
      }
    });

    // if dashboard settings are missing then add them
    if (!this.settings[UserSettings.DASHBOARD]) {
      this.settings[UserSettings.DASHBOARD] = new UserSettingsDashboardModel({});
    }
  }

  /**
   * Permissions - IPermissionBasic
   */
  canView(user: UserModel): boolean { return UserModel.canView(user); }
  canList(user: UserModel): boolean { return UserModel.canList(user); }
  canCreate(user: UserModel): boolean { return UserModel.canCreate(user); }
  canModify(user: UserModel): boolean { return UserModel.canModify(user); }
  canDelete(user: UserModel): boolean { return UserModel.canDelete(user); }

  /**
   * Permissions - IPermissionBasicBulk
   */
  canBulkCreate(): boolean { return UserModel.canBulkCreate(); }
  canBulkModify(): boolean { return UserModel.canBulkModify(); }
  canBulkDelete(user: UserModel): boolean { return UserModel.canBulkDelete(user); }
  canBulkRestore(): boolean { return UserModel.canBulkRestore(); }

  /**
   * Permissions - IPermissionExportable
   */
  canExport(user: UserModel): boolean { return UserModel.canExport(user); }

  /**
   * Permissions - IPermissionImportable
   */
  canImport(user: UserModel): boolean { return UserModel.canImport(user); }

  /**
     * Permissions - IPermissionUser
     */
  canModifyOwnAccount(user: UserModel): boolean { return UserModel.canModifyOwnAccount(user); }
  canListForFilters(user: UserModel): boolean { return UserModel.canListForFilters(user); }
  canListWorkload(user: UserModel): boolean { return UserModel.canListWorkload(user); }

  /**
     * Check if user has specific permissions
     */
  hasPermissions(...permissionIds: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[]): boolean {
    // do we have anything to check ?
    if (
      !permissionIds ||
            permissionIds.length < 1
    ) {
      return true;
    }

    // just one, then there is no point to loop
    // optimization ?
    if (permissionIds.length === 1) {
      // expression ?
      const permission = permissionIds[0];
      if (permission instanceof PermissionExpression) {
        return permission.allowed(this);
      } else if (typeof permission === 'function') {
        return permission(this);
      }

      // simple permissions
      return this.permissionIdsMapped[permission as PERMISSION];
    }

    // check if all permissions are in our list allowed permissions
    for (const permission of permissionIds) {
      if (
        (
          permission instanceof PermissionExpression &&
                    !permission.allowed(this)
        ) || (
          typeof permission === 'function' &&
                    !permission(this)
        ) || (
          !(permission instanceof PermissionExpression) &&
                    !(typeof permission === 'function') &&
                    !this.permissionIdsMapped[permission as PERMISSION]
        )
      ) {
        return false;
      }
    }

    // all permissions are allowed
    return true;
  }

  hasRole(roleId): boolean {
    return _.indexOf(this.roleIds, roleId) >= 0;
  }

  /**
   * Retrieve settings
   */
  getSettings(key: string) {
    return this.settings[key];
  }

  /**
     * User Name
     * @returns {string}
     */
  get name(): string {
    const firstName = _.get(this, 'firstName', '');
    const lastName = _.get(this, 'lastName', '');
    return _.trim(`${firstName} ${lastName}`);
  }

  /**
   * Get user name and email
   */
  get nameAndEmail(): string {
    return `${this.name} ( ${this.email} )`;
  }
}
