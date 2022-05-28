import { SafeHtml } from '@angular/platform-browser';

/**
 * Used by events
 */
export enum GroupEventDataAction {
  None = 'none',
  Partial = 'partial',
  All = 'all'
}

/**
 * Used for event input data
 */
export interface IGroupEventData {
  readonly group: any;
  readonly action: GroupEventDataAction;

  value: string[];
  readonly groupsMap: ISelectGroupMap<any>;
  readonly optionsMap: ISelectGroupOptionMap<any>;
  readonly previousValue: string[];
  addValues(...values: string[]): string[];
  hidePanel(): void;
}

/**
 * Used for event input data
 */
export interface IGroupOptionEventData {
  readonly group: any;
  readonly option: any;
  readonly checked: boolean;

  value: string[];
  readonly groupsMap: ISelectGroupMap<any>;
  readonly optionsMap: ISelectGroupOptionMap<any>;
  readonly allWasSelected: boolean;
  addValues(...values: string[]): string[];
  hidePanel(): void;
}

/**
 * Used to map groups for easy access to a group by using its unique key
 */
export interface ISelectGroupMap<T> {
  [groupValueKey: string]: T;
}

/**
 * Used to map group child options for easy access to a options and its parent group by using its unique key
 */
export interface ISelectGroupOptionMap<T> {
  [optionValue: string]: {
    groupValue: string,
    option: T
  };
}

/**
 * Used to format child option labels & tooltips
 */
export interface ISelectGroupOptionFormatResponse {
  label: SafeHtml;
  tooltip: string;
}
