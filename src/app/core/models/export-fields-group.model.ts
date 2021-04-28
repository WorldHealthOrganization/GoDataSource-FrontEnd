export class ExportFieldsGroupModel {
    [optionValue: string]: {
        [requiredOptionValue: string]: boolean
    };

    /**
     * Constructor
     */
    constructor(
        data = null
    ) {
        // extract fields group names and required options
        Object.keys(data || {}).map(groupName => {
            this[groupName] = {};
            if (data[groupName].required &&
                data[groupName].required.length
            ) {
                data[groupName].required.forEach((optionValueRequired) => {
                    this[groupName][optionValueRequired] = true;
                });
            }
        });
    }
}
