import * as _ from 'lodash';
import { LocationIdentifierModel } from './location-identifier.model';
import { BaseModel } from './base.model';
import { IPermissionBasic, IPermissionExportable, IPermissionImportable, IPermissionLocation } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class LocationModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionExportable,
        IPermissionImportable,
        IPermissionLocation {

    id: string;
    name: string;
    synonyms: string[];
    active: boolean;
    disabled: boolean;
    populationDensity: number;
    parentLocationId: string;
    geoLocation: { lat: number, lng: number } | null;
    geographicalLevelId: string;
    identifiers: LocationIdentifierModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_VIEW, PERMISSION.LOCATION_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_DELETE) : false; }

    /**
     * Static Permissions - IPermissionExportable
     */
    static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_EXPORT) : false; }

    /**
     * Static Permissions - IPermissionImportable
     */
    static canImport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_IMPORT) : false; }

    /**
     * Static Permissions - IPermissionLocation
     */
    static canListUsage(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_USAGE) : false; }
    static canPropagateGeoToPersons(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LOCATION_MODIFY, PERMISSION.LOCATION_USAGE, PERMISSION.LOCATION_PROPAGATE_GEO_TO_PERSONS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.synonyms = _.get(data, 'synonyms', []);
        this.active = _.get(data, 'active', true);
        this.disabled = _.get(data, 'disabled', false);
        this.populationDensity = _.get(data, 'populationDensity', 0);
        this.parentLocationId = _.get(data, 'parentLocationId');
        this.geoLocation = _.get(data, 'geoLocation', {});
        this.geographicalLevelId = _.get(data, 'geographicalLevelId');
        this.identifiers = _.get(data, 'identifiers', []);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return LocationModel.canView(user); }
    canList(user: UserModel): boolean { return LocationModel.canList(user); }
    canCreate(user: UserModel): boolean { return LocationModel.canCreate(user); }
    canModify(user: UserModel): boolean { return LocationModel.canModify(user); }
    canDelete(user: UserModel): boolean { return LocationModel.canDelete(user); }

    /**
     * Permissions - IPermissionExportable
     */
    canExport(user: UserModel): boolean { return LocationModel.canExport(user); }

    /**
     * Permissions - IPermissionImportable
     */
    canImport(user: UserModel): boolean { return LocationModel.canImport(user); }

    /**
     * Permissions - IPermissionLocation
     */
    canListUsage(user: UserModel): boolean { return LocationModel.canListUsage(user); }
    canPropagateGeoToPersons(user: UserModel): boolean { return LocationModel.canPropagateGeoToPersons(user); }

    get synonymsAsString(): string {
        return this.synonyms.join(' / ');
    }

    get identifiersAsString(): string {
        return _.map(this.identifiers, (identifier) => {
            return identifier.code;
        }).join(' / ');
    }
}
