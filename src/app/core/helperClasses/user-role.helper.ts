import { DomSanitizer } from '@angular/platform-browser';
import { I18nService } from '../services/helper/i18n.service';
import { IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
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

        // determine what permissions depend on a specific permission
        const determineRequiredBy = (selectedOptionId: string): string[] => {
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
        };

        // display required by popup only if we need to
        const displayRequiredByPopup = (
            requiredByList: string[],
            selectBackIds: string[],
            thirdButton?: {
                label: string,
                action: () => void,
                requiredPermissions: string[]
            }
        ) => {
            // display confirm popup if we are sure we wan't to uncheck this option
            if (
                !requiredByList ||
                requiredByList.length < 1
            ) {
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
                        data.addValues(...selectBackIds);
                    } else if (answer.button === DialogAnswerButton.Extra_1) {
                        thirdButton.action();
                    }
                });
        };

        // if we check this one, then we need to make sure we have all required permission checked as well
        if (data.checked) {
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
                            const requiredBy: string[] = determineRequiredBy(groupPermission.id);

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
                    displayRequiredByPopup(
                        selectedOptionRequiredByList,
                        [group.groupAllId], {
                            label: 'LNG_ROLE_AVAILABLE_PERMISSIONS_UNCHECK_CONFIRM_POPUP_YES_ONLY_REQUIRED_LABEL',
                            requiredPermissions: requiredGroupOptionsList,
                            action: () => {
                                data.addValues(...requiredGroupOptionsList);
                            }
                        }
                    );
                }
            }

            // #TODO
            // must handle both popups...
            // 1. group check back all ( above this comment )
            // 2. check if we need to add required permissions ( bellow this comment )

            // check if we need to add permissions
            if (selectedOption.requires) {
                // determine missing permissions
                const missingPermissions: string[] = (selectedOption.requires || []).filter((req: string): boolean => {
                    return !data.value || (
                        data.value.indexOf(req) === -1 && (
                            !data.optionsMap[req] ||
                            data.value.indexOf(data.optionsMap[req].groupValue) === -1
                        )
                    );
                });

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
        } else if (data.value) {
            // option unchecked - need to see if thi isn't required by other permissions
            displayRequiredByPopup(
                determineRequiredBy(selectedOption.id),
                [selectedOption.id]
            );
        }
    }
}
