import * as _ from 'lodash';
import { moment, Moment } from '../helperClasses/x-moment';
import { IPermissionBasic, IPermissionLanguage } from './permission.interface';
import { PERMISSION } from './permission.model';
import { UserModel } from './user.model';

export class LanguageTokenModel {
    token: string;
    translation: string;

    constructor(data = null) {
        this.token = _.get(data, 'token');
        this.translation = _.get(data, 'translation');
    }
}

export class LanguageTokenDetails {
    languageId: string;
    lastUpdateDate: Moment;
    tokens: LanguageTokenModel[];

    constructor(data = null) {
        this.languageId = _.get(data, 'languageId');

        this.lastUpdateDate = _.get(data, 'lastUpdateDate');
        this.lastUpdateDate = this.lastUpdateDate ? moment(this.lastUpdateDate) : null;

        this.tokens = _.get(data, 'tokens');
        this.tokens = (this.tokens || []).map((token) => new LanguageTokenModel(token));
    }
}

export class LanguageModel
    implements
        IPermissionBasic,
        IPermissionLanguage {
    id: string;
    name: string;
    tokens: LanguageTokenModel[];
    readOnly: boolean;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_VIEW, PERMISSION.LANGUAGE_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_DELETE) : false; }

    /**
     * Static Permissions - IPermissionLanguage
     */
    static canExportTokens(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_EXPORT_TOKENS) : false; }
    static canImportTokens(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LANGUAGE_IMPORT_TOKENS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.tokens = _.get(data, 'tokens', []);
        this.readOnly = _.get(data, 'readOnly', false);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return LanguageModel.canView(user); }
    canList(user: UserModel): boolean { return LanguageModel.canList(user); }
    canCreate(user: UserModel): boolean { return LanguageModel.canCreate(user); }
    canModify(user: UserModel): boolean { return LanguageModel.canModify(user); }
    canDelete(user: UserModel): boolean { return LanguageModel.canDelete(user); }

    /**
     * Permissions - IPermissionLanguage
     */
    canExportTokens(user: UserModel): boolean { return LanguageModel.canExportTokens(user); }
    canImportTokens(user: UserModel): boolean { return LanguageModel.canImportTokens(user); }
}
