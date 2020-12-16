import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import * as _ from 'lodash';
import { I18nService } from '../../../core/services/helper/i18n.service';

@Directive({
    selector: '[app-group-option-requirements-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => GroupOptionRequirementsValidator),
            multi: true
        }
    ]
})
export class GroupOptionRequirementsValidator implements Validator {
    // default values
    @Input() defaultValues: any[] = [];
    @Input() requiredWithoutDefaultValues: boolean = false;

    // Group key
    private _appGroupKey: string;
    @Input() set appGroupKey(appGroupKey: string) {
        // set value
        this._appGroupKey = appGroupKey;

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupKey(): string {
        return this._appGroupKey;
    }

    // Group options key
    private _appGroupOptionsKey: string;
    @Input() set appGroupOptionsKey(appGroupOptionsKey: string) {
        // set value
        this._appGroupOptionsKey = appGroupOptionsKey;

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupOptionsKey(): string {
        return this._appGroupOptionsKey;
    }

    // Group options value key
    private _appGroupOptionsValueKey: string;
    @Input() set appGroupOptionsValueKey(appGroupOptionsValueKey: string) {
        // set value
        this._appGroupOptionsValueKey = appGroupOptionsValueKey;

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupOptionsValueKey(): string {
        return this._appGroupOptionsValueKey;
    }

    // Group options label key
    private _appGroupOptionsLabelKey: string;
    @Input() set appGroupOptionsLabelKey(appGroupOptionsLabelKey: string) {
        // set value
        this._appGroupOptionsLabelKey = appGroupOptionsLabelKey;

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupOptionsLabelKey(): string {
        return this._appGroupOptionsLabelKey;
    }

    // Group options requirements key
    private _appGroupOptionsRequirementsKey: string;
    @Input() set appGroupOptionsRequirementsKey(appGroupOptionsRequirementsKey: string) {
        // set value
        this._appGroupOptionsRequirementsKey = appGroupOptionsRequirementsKey;

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupOptionsRequirementsKey(): string {
        return this._appGroupOptionsRequirementsKey;
    }

    // group options
    private _childOptionToGroupMap: {
        [key: string]: string
    } = {};
    private _childOptionMap: {
        [key: string]: any
    } = {};
    private _requirementsMap: {
        [key: string]: string[]
    } = {};
    private _appGroupRequiredOptions: any[];
    @Input() set appGroupRequiredOptions(appGroupRequiredOptions: any[]) {
        // set value
        this._appGroupRequiredOptions = appGroupRequiredOptions || [];

        // determine required options
        this.determineRequiredOptionsMap();
    }
    get appGroupRequiredOptions(): any[] {
        return this._appGroupRequiredOptions;
    }

    /**
     * Constructor
     */
    constructor(
        private i18nService: I18nService
    ) {}

    /**
     * Construct map to easily determine which options are required
     */
    private determineRequiredOptionsMap() {
        // we need all the keys to determine map
        if (
            !this.appGroupKey ||
            !this.appGroupOptionsKey ||
            !this.appGroupOptionsValueKey ||
            !this.appGroupOptionsRequirementsKey
        ) {
            return;
        }

        // reset map value
        this._childOptionMap = {};
        this._childOptionToGroupMap = {};
        this._requirementsMap = {};

        // do we have data to construct the map ?
        if (
            !this.appGroupRequiredOptions ||
            this.appGroupRequiredOptions.length < 1
        ) {
            return;
        }

        // go through each group and determine requirements
        this.appGroupRequiredOptions.forEach((group: any) => {
            // determine children requirements
            if (
                group[this.appGroupOptionsKey] &&
                group[this.appGroupOptionsKey].length > 0
            ) {
                // go through option requirements
                group[this.appGroupOptionsKey].forEach((option: any) => {
                    // set option parent
                    this._childOptionToGroupMap[option[this.appGroupOptionsValueKey]] = group[this.appGroupKey];
                    this._childOptionMap[option[this.appGroupOptionsValueKey]] = option;

                    // does this option have requirements ?
                    if (
                        option[this.appGroupOptionsRequirementsKey] &&
                        option[this.appGroupOptionsRequirementsKey].length > 0
                    ) {
                        // set option requirements
                        this._requirementsMap[option[this.appGroupOptionsValueKey]] = _.uniq(option[this.appGroupOptionsRequirementsKey]);

                        // set parent requirements
                        this._requirementsMap[group[this.appGroupKey]] = _.uniq([
                            ...this._requirementsMap[option[this.appGroupOptionsValueKey]],
                            ...(this._requirementsMap[group[this.appGroupKey]] ? this._requirementsMap[group[this.appGroupKey]] : [])
                        ]);
                    }
                });
            }
        });
    }

    /**
     * Validate function - called when input needs to be validated
     */
    validate(
        control: AbstractControl
    ): {
        [key: string]: any
    } {
        // we need requirement data to validate
        if (_.isEmpty(this._requirementsMap)) {
            return null;
        }

        // empty is handled by default required validator
        if ( _.isEmpty(control.value)) {
            return null;
        }

        // handle custom required validator
        if (
            this.requiredWithoutDefaultValues &&
            this.defaultValues &&
            this.defaultValues.length > 0
        ) {
            // remove default values
            const realValue: any[] = control.value.filter((itemKey: string) => {
                return !this.defaultValues.find((defaultItem: any) => {
                    return defaultItem[this.appGroupOptionsValueKey] === itemKey;
                });
            });

            // no values selected ?
            if (realValue.length < 1) {
                return {
                    required: true
                };
            }
        }

        // map values for easy access
        const valuesMap: {
            [key: string]: boolean
        } = {};
        control.value.forEach((value: string) => {
            valuesMap[value] = true;
        });

        // get values and determine requirements recursively
        const alreadyChecked: {
            [key: string]: boolean
        } = {};
        const determineMissingRequirements = (values: string[]): string[] => {
            // determine missing requirements
            const missingReqs: string[] = [];
            (values || []).forEach((value: string) => {
                // checked already ?
                if (alreadyChecked[value]) {
                    return;
                }

                // mark as already checked
                alreadyChecked[value] = true;

                // do we have requirements for this value ?
                if (this._requirementsMap[value]) {
                    // check if we have all requirements
                    this._requirementsMap[value].forEach((req: string) => {
                        // check if we have this requirement
                        if (
                            !valuesMap[req] && (
                                !this._childOptionToGroupMap[req] ||
                                !valuesMap[this._childOptionToGroupMap[req]]
                            ) &&
                            missingReqs.indexOf(req) < 0
                        ) {
                            missingReqs.push(req);
                        }
                    });

                    // check if these requirements has other requirements - recursively
                    // make sure to exclude what was checked before, so we don't enter in an infinite loop
                    missingReqs.push(...determineMissingRequirements(this._requirementsMap[value]));
                }
            });

            // finished
            return _.uniq(missingReqs);
        };

        // determine missing requirements
        const missingRequirements: string[] = determineMissingRequirements(control.value);

        // do we have missing requirements ?
        if (
            missingRequirements &&
            missingRequirements.length > 0
        ) {
            return {
                missingRequiredOptions: {
                    options: missingRequirements
                        .map((option: string): string => {
                            // transform option to label
                            return this.appGroupOptionsLabelKey ?
                                this.i18nService.instant(this._childOptionMap[option][this.appGroupOptionsLabelKey]) :
                                option;
                        })
                        .sort((item1: string, item2: string) => {
                            return item1.toLowerCase().localeCompare(item2.toLowerCase());
                        })
                }
            };
        }

        // everything is okay
        return null;
    }
}
