import { LabelValuePair } from './label-value-pair';
import { I18nService } from '../services/helper/i18n.service';

export enum ExportFieldsGroupModelNameEnum {
  CASE = 'case',
  CONTACT = 'contact',
  CONTACT_OF_CONTACT = 'ContactOfContact',
  EVENT = 'event',
  FOLLOWUP = 'followUp',
  LAB_RESULT = 'LabResult',
  RELATIONSHIP = 'relationship'
}

export interface IExportFieldsGroupRequired {
  [optionValue: string]: string[];
}

export class ExportFieldsGroupModel {
  options: {
    name: string;
    requires: string[];
  }[];

  /**
     * Constructor
     */
  constructor(
    data = null
  ) {
    this.options = Object.keys(data || {}).map((groupName) => ({
      name: groupName,
      requires: data[groupName].required ? data[groupName].required : []
    }));
  }

  /**
     * Returns options names as LabelValuePair sorted list
     */
  toLabelValuePair(i18nService: I18nService): LabelValuePair[] {
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
