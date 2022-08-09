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
