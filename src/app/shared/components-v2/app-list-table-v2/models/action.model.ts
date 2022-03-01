import { Params } from '@angular/router';

/**
 * Action Type
 */
export enum V2RowActionType {
  ICON = 'icon',
  MENU = 'menu'
}

/**
 * Click
 */
interface IV2RowActionClick {
  // required
  click: (data: any) => void;

  // make sure we don't use these together because IV2RowActionIcon & (IV2RowActionClick | IV2RowActionLink) isn't working properly
  link?: never;
  linkQueryParams?: never;
}

/**
 * Link
 */
interface IV2RowActionLink {
  // required
  link: (data: any) => string[];

  // make sure we don't use these together because IV2RowActionIcon & (IV2RowActionClick | IV2RowActionLink) isn't working properly
  click?: never;
  linkQueryParams?: (data: any) => Params;
}

/**
 * Row action Icon
 */
interface IV2RowActionIcon {
  // type
  type: V2RowActionType.ICON;
  icon: string;

  // optional
  iconTooltip?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
}

/**
 * Row action Menu option
 */
interface IV2RowActionMenuOption {
  // menu option
  label: string;

  // optional
  cssClasses?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
}

/**
 * Row action Menu divider
 */
interface IV2RowActionMenuDivider {
  // optional
  visible?: (data: any) => boolean;
}

/**
 * Row action Menu
 */
interface IV2RowActionMenu {
  // type
  type: V2RowActionType.MENU;
  icon: string;
  menuOptions: ((IV2RowActionMenuOption & (IV2RowActionClick | IV2RowActionLink)) | IV2RowActionMenuDivider)[];

  // optional
  iconTooltip?: string;
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Action
 */
export type V2RowAction = (IV2RowActionIcon & (IV2RowActionClick | IV2RowActionLink)) | IV2RowActionMenu;
