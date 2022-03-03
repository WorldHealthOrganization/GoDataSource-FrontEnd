import { Params } from '@angular/router';

/**
 * Action Type
 */
export enum V2ActionType {
  ICON = 'icon',
  MENU = 'menu',
  ICON_LABEL = 'icon_label'
}

/**
 * Click
 */
interface IV2ActionClick {
  // required
  click: (data: any) => void;
}

/**
 * Link
 */
interface IV2ActionLink {
  // required
  link: (data: any) => string[];

  // optional
  linkQueryParams?: (data: any) => Params;
}

/**
 * Action Icon
 */
interface IV2ActionIcon {
  // type
  type: V2ActionType.ICON;
  icon: string;
  action: IV2ActionClick | IV2ActionLink;

  // optional
  iconTooltip?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
}

/**
 * Action Icon
 */
export interface IV2ActionIconLabel {
  // type
  type: V2ActionType.ICON_LABEL;
  icon: string;
  label: string;
  action: IV2ActionClick | IV2ActionLink;

  // optional
  iconTooltip?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
}

/**
 * Action Menu option
 */
interface IV2ActionMenuOption {
  // menu option
  label: string;
  action: IV2ActionClick | IV2ActionLink;

  // optional
  cssClasses?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
}

/**
 * Action Menu divider
 */
interface IV2ActionMenuDivider {
  // optional
  label?: never;
  visible?: (data: any) => boolean;
}

/**
 * Action Menu
 */
interface IV2ActionMenu {
  // type
  type: V2ActionType.MENU;
  menuOptions: (IV2ActionMenuOption | IV2ActionMenuDivider)[];

  // optional
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Icon action Menu
 */
interface IV2ActionMenuIcon extends IV2ActionMenu {
  // required
  icon: string;

  // optional
  iconTooltip?: string;
}

/**
 * Label action Menu
 */
export interface IV2ActionMenuLabel extends IV2ActionMenu {
  // required
  label: string;
  menuOptions: (IV2ActionMenuOption | IV2ActionMenuDivider)[];

  // optional
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Action
 */
export type V2Action = IV2ActionIcon | IV2ActionMenuIcon | IV2ActionMenuLabel;
