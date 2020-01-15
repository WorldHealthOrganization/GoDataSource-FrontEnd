import { DomSanitizer } from '@angular/platform-browser';
import { I18nService } from '../services/helper/i18n.service';
import { GroupEventDataAction, IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
import { IPermissionChildModel, PERMISSION, PermissionModel } from '../models/permission.model';
import { DialogService } from '../services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration } from '../../shared/components';
import { MatDialogRef } from '@angular/material';
import * as _ from 'lodash';

export class UserRoleHelper {
    /**
     * Add required permissions to token
     */
    public static groupOptionFormatMethod(
        sanitized: DomSanitizer,
        i18nService: I18nService,
        groupsMap: ISelectGroupMap<PermissionModel>,
        optionsMap: ISelectGroupOptionMap<IPermissionChildModel>,
        option: IPermissionChildModel
    ): ISelectGroupOptionFormatResponse {
        // define response
        const response: ISelectGroupOptionFormatResponse = {
            label: '',
            tooltip: ''
        };

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

            // sort list before we display it
            requiredPermissionTranslations.sort((label1: string, label2: string) => {
                return label1.toLowerCase().localeCompare(label2.toLowerCase());
            });

            // do we have extra required permissions ?
            let extraRequiredPermMessage: string = '';
            if (requiredPermissionTranslations.length > 0) {
                extraRequiredPermMessage = requiredPermissionTranslations.join(', ');
            }

            // label
            response.label = sanitized.bypassSecurityTrustHtml(
                i18nService.instant(
                    'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_LABEL_MESSAGE', {
                        label: option.label ?
                            i18nService.instant(option.label) :
                            '',
                        requirements: extraRequiredPermMessage ?
                            i18nService.instant(
                                'LNG_ROLE_AVAILABLE_PERMISSIONS_LABEL_REQUIRE_MESSAGE', {
                                    labels: extraRequiredPermMessage
                                }
                            ) : ''
                    }
                )
            );

            // tooltip
            response.tooltip = i18nService.instant(
                'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_TOOLTIP_MESSAGE', {
                    tooltip: option.description ?
                        i18nService.instant(option.description) :
                        '',
                    requirements: extraRequiredPermMessage ?
                        i18nService.instant(
                            'LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRES_MESSAGE', {
                                labels: extraRequiredPermMessage
                            }
                        ) : ''
                }
            );
        } else {
            // label
            response.label = option.label ?
                i18nService.instant(option.label) :
                '';

            // tooltip
            response.tooltip = option.description ?
                i18nService.instant(option.description) :
                '';
        }

        // nothing else to include
        return response;
    }

    /**
     * Display popup with required permissions
     */
    private static displayRequiredByPopup(
        sanitized: DomSanitizer,
        i18nService: I18nService,
        dialogService: DialogService,
        data: {
            readonly optionsMap: ISelectGroupOptionMap<any>,
            readonly groupsMap: ISelectGroupMap<any>,
            value: string[],
            addValues(...values: string[]): string[]
        },
        requiredByList: string[],
        selectBackIds: string[],
        doAfterPopupCloses?: () => void,
        thirdButton?: {
            label: string,
            action: () => void,
            requiredPermissions: string[]
        }
    ) {
        // display confirm popup if we are sure we wan't to uncheck this option
        if (
            !requiredByList ||
            requiredByList.length < 1
        ) {
            // continue with the next step
            if (doAfterPopupCloses) {
                doAfterPopupCloses();
            }

            // finished - nothing to display
            return;
        }

        // labels
        const requiredByLabel: string = i18nService.instant('LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRED_BY_PERMISSIONS_LABEL');
        const requiredLabel: string = i18nService.instant('LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRED_PERMISSIONS_LABEL');

        // determine missing permission labels
        let labels: string[] = requiredByList.map((permission): string => {
            return `<div>${data.optionsMap[permission] ?
                i18nService.instant((data.optionsMap[permission].option as IPermissionChildModel).label) : (
                    data.groupsMap[permission] ?
                        i18nService.instant((data.groupsMap[permission] as PermissionModel).groupLabel) :
                        permission
                )}</div>`;
        });

        // add required permissions ?
        if (
            thirdButton &&
            thirdButton.requiredPermissions &&
            thirdButton.requiredPermissions.length > 0
        ) {
            labels = [
                `<div style="font-weight: bold;">${requiredByLabel}</div>`,
                ...labels,
                `<br /><div style="font-weight: bold;">${requiredLabel}</div>`,
                ...thirdButton.requiredPermissions.map((permission): string => {
                    return `<div>${data.optionsMap[permission] ?
                        i18nService.instant((data.optionsMap[permission].option as IPermissionChildModel).label) :
                        permission
                    }</div>`;
                })
            ];
        }

        // configure dialog
        const dialogConfiguration = new DialogConfiguration({
            message: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_MESSAGE',
            additionalInfo: sanitized.bypassSecurityTrustHtml(labels.join('')),
            yesLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_YES_LABEL',
            cancelLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_NO_LABEL'
        });

        // handle third button
        if (thirdButton) {
            dialogConfiguration.addDefaultButtons = true;
            dialogConfiguration.buttons = [
                new DialogButton({
                    label: thirdButton.label,
                    clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                    }
                })
            ];
        }

        // display confirm dialog - should we check back the unchecked option ?
        dialogService
            .showConfirm(dialogConfiguration)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    data.value = data.addValues(...selectBackIds);
                } else if (answer.button === DialogAnswerButton.Extra_1) {
                    thirdButton.action();
                }

                // finished
                if (doAfterPopupCloses) {
                    doAfterPopupCloses();
                }
            });
    }

    /**
     * Determine what permissions depend on a specific permission
     */
    private static determineRequiredBy(
        data: {
            readonly optionsMap: ISelectGroupOptionMap<any>,
            readonly groupsMap: ISelectGroupMap<any>,
            value: string[]
        },
        selectedOptionId: string
    ): string[] {
        // check child options
        const requiredList: string[] = [];
        data.value.forEach((checkedOption: string) => {
            // child / group options
            if (data.optionsMap[checkedOption]) {
                // child option
                const option: IPermissionChildModel = data.optionsMap[checkedOption].option;
                if (
                    option &&
                    option.requires &&
                    option.requires.length > 0 &&
                    option.requires.indexOf(selectedOptionId as any) > -1
                ) {
                    requiredList.push(option.id);
                }
            } else if (data.groupsMap[checkedOption]) {
                // group option
                const group: PermissionModel = data.groupsMap[checkedOption];
                _.each(group.permissions, (permission: IPermissionChildModel) => {
                    if (
                        permission.requires &&
                        permission.requires.length > 0 &&
                        permission.requires.indexOf(selectedOptionId as any) > -1
                    ) {
                        // add group to list of items that requires this option
                        requiredList.push(checkedOption);

                        // stop for each
                        return false;
                    }
                });
            }
        });

        // finished
        return requiredList;
    }

    /**
     * Determine all required permissions ( recursive )
     */
    private static determineMissingPermissions(
        data: {
            readonly optionsMap: ISelectGroupOptionMap<any>,
            value: string[]
        },
        option: IPermissionChildModel,
        checkedPermission: {
            [permission: string]: boolean
        },
        missingPermissions: string[]
    ) {
        (option.requires || []).forEach((req: string) => {
            // there is no point in checking again when this permission was checked already
            if (checkedPermission[req]) {
                return;
            }

            // mark as checked
            checkedPermission[req] = true;

            // do we need to add this one to missing permissions ?
            if (
                !data.value || (
                    data.value.indexOf(req) === -1 && (
                        !data.optionsMap[req] ||
                        data.value.indexOf(data.optionsMap[req].groupValue) === -1
                    )
                )
            ) {
                // add it the list of missing missingPermissions
                missingPermissions.push(req);

                // check children permissions
                if (data.optionsMap[req]) {
                    const requireOption: IPermissionChildModel = data.optionsMap[req].option;
                    if (
                        requireOption.requires &&
                        requireOption.requires.length > 0
                    ) {
                        UserRoleHelper.determineMissingPermissions(
                            data,
                            requireOption,
                            checkedPermission,
                            missingPermissions
                        );
                    }
                }
            }
        });
    }

    /**
     * Display requires popup
     */
    private static displayRequiresPopup(
        data: {
            readonly optionsMap: ISelectGroupOptionMap<any>,
            addValues(...values: string[]): string[]
        },
        missingPermissions: string[],
        i18nService: I18nService,
        dialogService: DialogService
    ) {
        // do we need to request user if he want to enable missing permissions ?
        if (
            missingPermissions &&
            missingPermissions.length > 0
        ) {
            // determine missing permission labels
            const labels: string[] = missingPermissions.map((permission): string => {
                return `<div>${data.optionsMap[permission] ?
                    i18nService.instant((data.optionsMap[permission].option as IPermissionChildModel).label) :
                    permission}</div>`;
            });

            // display confirm dialog - should we add missing required permissions ?
            dialogService
                .showConfirm(new DialogConfiguration({
                    message: 'LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRES_CONFIRM_POPUP_MESSAGE',
                    additionalInfo: labels.join(''),
                    yesLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRES_CONFIRM_POPUP_YES_LABEL',
                    cancelLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_REQUIRES_CONFIRM_POPUP_NO_LABEL'
                }))
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        data.addValues(...missingPermissions);
                    }
                });
        }
    }

    /**
     * Group child option check state changed
     */
    public static groupOptionCheckStateChanged(
        data: IGroupOptionEventData,
        sanitized: DomSanitizer,
        i18nService: I18nService,
        dialogService: DialogService
    ) {
        // determine selected option
        const selectedOption: IPermissionChildModel = data.option;
        if (!selectedOption) {
            return;
        }

        // if we check this one, then we need to make sure we have all required permission checked as well
        if (data.checked) {
            // check for missing permissions
            const checkSelectionMissingPermissions = () => {
                // check if we need to add permissions
                if (selectedOption.requires) {
                    // method to recursively determine missing permissions
                    const checkedPermission: {
                        [permission: string]: boolean
                    } = {};
                    const missingPermissions: string[] = [];
                    UserRoleHelper.determineMissingPermissions(
                        data,
                        selectedOption,
                        checkedPermission,
                        missingPermissions
                    );

                    // do we need to request user if he want to enable missing permissions ?
                    this.displayRequiresPopup(
                        data,
                        missingPermissions,
                        i18nService,
                        dialogService
                    );
                }
            };

            // check if we switched from all options to partial
            if (data.allWasSelected) {
                // must check all child options if they weren't used
                const group: PermissionModel = data.group;
                if (group) {
                    // determine all required by permissions
                    const requiredGroupOptionsList: string[] = [];
                    const selectedOptionRequiredByList: string[] = [];
                    (group.permissions || []).forEach((groupPermission: IPermissionChildModel) => {
                        // don't take in account the checked one
                        if (groupPermission.id !== selectedOption.id) {
                            // retrieve list of required by
                            const requiredBy: string[] = UserRoleHelper.determineRequiredBy(
                                data,
                                groupPermission.id
                            );

                            // did we find any dependable permissions ?
                            if (requiredBy.length > 0) {
                                // add it to the list of required permissions
                                requiredGroupOptionsList.push(groupPermission.id);

                                // add only items that aren't already in the list to required by list
                                requiredBy.forEach((value) => {
                                    if (selectedOptionRequiredByList.indexOf(value) === -1) {
                                        selectedOptionRequiredByList.push(value);
                                    }
                                });
                            }
                        }
                    });

                    // display dependable options
                    UserRoleHelper.displayRequiredByPopup(
                        sanitized,
                        i18nService,
                        dialogService,
                        data,
                        selectedOptionRequiredByList,
                        [group.groupAllId],
                        () => {
                            // check if we need to add required permissions
                            checkSelectionMissingPermissions();
                        }, {
                            label: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_YES_ONLY_REQUIRED_LABEL',
                            requiredPermissions: requiredGroupOptionsList,
                            action: () => {
                                data.value = data.addValues(...requiredGroupOptionsList);
                            }
                        }
                    );
                }
            } else {
                // check if we need to add required permissions
                checkSelectionMissingPermissions();
            }
        } else if (data.value) {
            // option unchecked - need to see if thi isn't required by other permissions
            UserRoleHelper.displayRequiredByPopup(
                sanitized,
                i18nService,
                dialogService,
                data,
                UserRoleHelper.determineRequiredBy(
                    data,
                    selectedOption.id
                ),
                [selectedOption.id]
            );
        }
    }

    /**
     * Group checked other option ( all / none / partial )
     */
    public static groupSelectionChanged(
        data: IGroupEventData,
        sanitized: DomSanitizer,
        i18nService: I18nService,
        dialogService: DialogService
    ) {
        // check if we don't have permissions that require permissions that we wan't to disable by changing to None
        if (data.action === GroupEventDataAction.None) {
            // get data
            const group: PermissionModel = data.group;

            // determine partial / all permissions that were removed
            const uncheckedPermissionIds: string[] = [];
            const allUncheckedPermissionIds: string[] = [];
            (data.previousValue || []).forEach((permissionId: string) => {
                // check if it is an all permission
                if (permissionId === group.groupAllId) {
                    // add it the list of check to check back
                    uncheckedPermissionIds.push(permissionId);

                    // add unique values - not really needed since previousValue should contain only unique values
                    (group.permissions || []).forEach((groupChildPermission) => {
                        if (allUncheckedPermissionIds.indexOf(groupChildPermission.id) === -1) {
                            allUncheckedPermissionIds.push(groupChildPermission.id);
                        }
                    });
                } else if (
                    data.optionsMap[permissionId] &&
                    data.optionsMap[permissionId].groupValue === group.groupAllId
                ) {
                    // add unique values - not really needed since previousValue should contain only unique values
                    if (allUncheckedPermissionIds.indexOf(permissionId) === -1) {
                        // add it the list of check to check back
                        uncheckedPermissionIds.push(permissionId);

                        // add it to the list of checks needed
                        allUncheckedPermissionIds.push(permissionId);
                    }
                }
            });

            // do we have changed permissions ?
            if (allUncheckedPermissionIds.length > 0) {
                // determine required by permissions
                const requiredByPermissions: string[] = [];
                const requiredPermissions: string[] = [];
                allUncheckedPermissionIds.forEach((permissionId: string) => {
                    // required by
                    const tempRequiredBY = UserRoleHelper.determineRequiredBy(
                        data,
                        permissionId
                    );

                    // add to list only permissions that are actually required
                    if (tempRequiredBY.length > 0) {
                        requiredPermissions.push(permissionId);
                    }

                    // add unique values to required by list
                    (tempRequiredBY || []).forEach((requiredByPermissionId: string) => {
                        if (requiredByPermissions.indexOf(requiredByPermissionId) === -1) {
                            requiredByPermissions.push(requiredByPermissionId);
                        }
                    });
                });

                // do we need to display revert back popup ?
                if (requiredByPermissions.length > 0) {
                    UserRoleHelper.displayRequiredByPopup(
                        sanitized,
                        i18nService,
                        dialogService,
                        data,
                        requiredByPermissions,
                        uncheckedPermissionIds,
                        undefined,
                        _.isEqual(uncheckedPermissionIds, requiredPermissions) ? undefined : {
                            label: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_YES_ONLY_REQUIRED_LABEL',
                            requiredPermissions: requiredPermissions,
                            action: () => {
                                data.value = data.addValues(...requiredPermissions);
                            }
                        }
                    );
                }
            }
        } else if (data.action === GroupEventDataAction.All) {
            // we need to determine required permissions under all options
            const group: PermissionModel = data.group;

            // method to recursively determine missing permissions
            const checkedPermission: {
                [permission: string]: boolean
            } = {};
            const missingPermissions: string[] = [];
            (group.permissions || []).forEach((groupChildPermission: IPermissionChildModel) => {
                UserRoleHelper.determineMissingPermissions(
                    data,
                    groupChildPermission,
                    checkedPermission,
                    missingPermissions
                );
            });

            // do we have missing permissions
            this.displayRequiresPopup(
                data,
                missingPermissions,
                i18nService,
                dialogService
            );
        }
    }
}
