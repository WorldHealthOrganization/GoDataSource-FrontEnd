import * as _ from 'lodash';
import { IPermissionChildModel, PERMISSION, PermissionModel } from './permission.model';
import { I18nService } from '../services/helper/i18n.service';
import { ISelectGroupMap, ISelectGroupOptionMap } from '../../shared/xt-forms/components/form-select-groups/form-select-groups.component';

export class UserRoleModel {
    id: string | null;
    name: string | null;
    permissionIds: PERMISSION[];
    description: string | null;
    permissions: IPermissionChildModel[];

    /**
     * Add required permissions to token
     */
    public static groupOptionFormatTooltipMethod(
        i18nService: I18nService,
        groupsMap: ISelectGroupMap<PermissionModel>,
        optionsMap: ISelectGroupOptionMap<IPermissionChildModel>,
        option: IPermissionChildModel,
        tooltipToken: string
    ): string {
        // do we need to include permission requirements
        if (
            option.requires &&
            option.requires.length > 0
        ) {
            // determine requirement tokens
            const requiredPermissionTranslations: string[] = [];
            option.requires.forEach((requiredPermission: PERMISSION) => {
                if (
                    optionsMap[requiredPermission] &&
                    optionsMap[requiredPermission].option.label
                ) {
                    requiredPermissionTranslations.push(i18nService.instant(optionsMap[requiredPermission].option.label));
                }
            });

            // do we have extra required permissions ?
            let extraRequiredPermMessage: string = '';
            if (requiredPermissionTranslations.length > 0) {
                extraRequiredPermMessage = requiredPermissionTranslations.join(', ');
            }

            // construct the final message
            return i18nService.instant(
                'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_TOOLTIP_MESSAGE', {
                    tooltip: tooltipToken ?
                        i18nService.instant(tooltipToken) :
                        '',
                    requirements: i18nService.instant(
                        'LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRES_MESSAGE', {
                            labels: extraRequiredPermMessage
                        }
                    )
                }
            );
        }

        // nothing else to include
        return tooltipToken ?
            i18nService.instant(tooltipToken) :
            '';
    }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.permissionIds = _.get(data, 'permissionIds', []);
        this.description = _.get(data, 'description');
    }
}
