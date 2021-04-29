import {LabelValuePair} from './label-value-pair';

export interface IExportFieldsGroupRequired {
    [optionValue: string]: string[];
}

export interface IExportFieldsGroup {
    name: string;
    requires: IExportFieldsGroupRequired[];
}

export class ExportFieldsGroupModel {
    options: IExportFieldsGroup[];

    /**
     * Constructor
     */
    constructor(
        data = null
    ) {
        // extract fields group names and required options
        this.options = [];
        Object.keys(data || {}).map(groupName => {
            this.options.push({
                name: groupName,
                requires: data[groupName].required ? data[groupName].required : []
            });
        });
    }

    /**
     * Returns options names as LabelValuePair sorted list
     */
    toLabelValuePair(i18nService): LabelValuePair[] {
        // map options
        let optionNameList = this.options.map((item) =>
            new LabelValuePair(
                item.name,
                item.name
            ));

        // sort by translated tokens
        optionNameList = optionNameList.sort((item1, item2) => {
            const a = item1.label ? i18nService.instant(item1.label) : '';
            const b = item2.label ? i18nService.instant(item2.label) : '';
            return a.localeCompare(b);
        });

        // return the sorted list
        return optionNameList;
    }

    /**
     * Returns required options
     */
    toRequiredList(): IExportFieldsGroupRequired {
        const requiredOptions = {};
        this.options.forEach((item) => {
            requiredOptions[item.name] = item.requires;
        });

        return requiredOptions;
    }

}
