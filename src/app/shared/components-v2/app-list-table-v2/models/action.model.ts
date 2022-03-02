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
}

/**
 * Link
 */
interface IV2RowActionLink {
  // required
  link: (data: any) => string[];

  // optional
  linkQueryParams?: (data: any) => Params;
}

/**
 * Row action Icon
 */
interface IV2RowActionIcon {
  // type
  type: V2RowActionType.ICON;
  icon: string;
  action: IV2RowActionClick | IV2RowActionLink;

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
  action: IV2RowActionClick | IV2RowActionLink;

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
  label?: never;
  visible?: (data: any) => boolean;
}

/**
 * Row action Menu
 */
interface IV2RowActionMenu {
  // type
  type: V2RowActionType.MENU;
  menuOptions: (IV2RowActionMenuOption | IV2RowActionMenuDivider)[];

  // optional
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Row icon action Menu
 */
interface IV2RowActionMenuIcon extends IV2RowActionMenu {
  // required
  icon: string;

  // optional
  iconTooltip?: string;
}

/**
 * Row label action Menu
 */
export interface IV2RowActionMenuLabel extends IV2RowActionMenu {
  // required
  label: string;
  menuOptions: (IV2RowActionMenuOption | IV2RowActionMenuDivider)[];

  // optional
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Action
 */
export type V2RowAction = IV2RowActionIcon | IV2RowActionMenuIcon | IV2RowActionMenuLabel;
