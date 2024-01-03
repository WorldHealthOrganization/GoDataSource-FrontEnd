import { Params } from '@angular/router';

/**
 * Action Type
 */
export enum V2ActionType {
  ICON = 'icon',
  MENU = 'menu',
  ICON_LABEL = 'icon_label',
  LINK = 'link',
  GROUP_ACTIONS = 'group_actions'
}

/**
 * Click
 */
interface IV2ActionClick {
  // required
  click: (data: any) => void;

  // exclude
  link?: never;
  linkQueryParams?: never;
}

/**
 * Link
 */
interface IV2ActionLink {
  // required
  link: (data: any) => string[];

  // optional
  linkQueryParams?: (data: any) => Params;

  // exclude
  click?: never;
}

/**
 * Link
 */
export interface IV2Link {
  // type
  type: V2ActionType.LINK;
  action: IV2ActionLink;

  // optional
  visible?: (data: any) => boolean;
}

/**
 * Action Icon
 */
export interface IV2ActionIcon {
  // type
  type: V2ActionType.ICON;
  icon: string;
  action: IV2ActionClick | IV2ActionLink;

  // optional
  iconTooltip?: string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
  cssClasses?: (data: any) => string;
  loading?: (data: any) => boolean;

  // never
  label?: never;
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

  // never
  cssClasses?: never;
}

/**
 * Action Menu option
 */
interface IV2ActionMenuOption {
  // menu option
  label: {
    // required
    get: (data: any) => string,

    // optional
    data?: (data: any) => {
      [key: string]: string
    }
  };
  action: IV2ActionClick | IV2ActionLink;

  // optional
  cssClasses?: (data: any) => string;
  visible?: (data: any) => boolean;
  disable?: (data: any) => boolean;
  tooltip?: (data: any) => string;
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
 * Menu item
 */
export type V2ActionMenuItem = IV2ActionMenuOption | IV2ActionMenuDivider;

/**
 * Group Actions
 */
export interface IV2GroupActions {
  // type
  type: V2ActionType.GROUP_ACTIONS;
  actions: V2ActionMenuItem[];

  // optional
  visible?: () => boolean;
}

/**
 * Action Menu
 */
interface IV2ActionMenu {
  // type
  type: V2ActionType.MENU;
  menuOptions: V2ActionMenuItem[];

  // optional
  visible?: (data: any) => boolean;
  disable?: (item: any) => boolean;
}

/**
 * Icon action Menu
 */
export interface IV2ActionMenuIcon extends IV2ActionMenu {
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
}

/**
 * Action
 */
export type V2Action = IV2ActionIcon | IV2ActionMenuIcon | IV2ActionMenuLabel;
