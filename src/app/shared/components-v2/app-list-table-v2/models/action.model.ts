/**
 * Action Type
 */
enum V2RowActionType {
  ICON = 'icon',
  MENU = 'menu'
}

/**
 * Row action Icon
 */
interface IV2RowActionIcon {
  // type
  type: V2RowActionType.ICON;
  icon: string;
  click: (item: any, handler: any, index: any) => void;

  // optional
  iconTooltip?: string;
  visible?: (item: any, index: any) => boolean;
  disable?: (item: any, index: any) => boolean;
}

/**
 * Row action Menu option
 */
interface IV2RowActionMenuOption {
  // menu option
  label: string;
  click: (item: any, handler: any, index: any) => void;

  // optional
  visible?: (item: any, index: any) => boolean;
  disable?: (item: any, index: any) => boolean;
}

/**
 * Row action Menu divider
 */
interface IV2RowActionMenuDivider {
  // optional
  visible?: (item: any, index: any) => boolean;
}

/**
 * Row action Menu
 */
interface IV2RowActionMenu {
  // type
  type: V2RowActionType.MENU;
  icon: string;
  menuOptions: (IV2RowActionMenuOption | IV2RowActionMenuDivider)[];

  // optional
  iconTooltip?: string;
  visible?: (item: any, index: any) => boolean;
  disable?: (item: any, index: any) => boolean;
}

/**
 * Action
 */
export type V2RowAction = IV2RowActionIcon | IV2RowActionMenu;
