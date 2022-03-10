/**
 * Bottom dialog button type
 */
export enum IV2BottomDialogConfigButtonType {
  CANCEL,
  OTHER
}

/**
 * Bottom dialog button
 */
export interface IV2BottomDialogConfigButton {
  // required
  type: IV2BottomDialogConfigButtonType;
  label: string;

  // optional
  color?: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  key?: string;
}

/**
 * Bottom dialog config message
 */
export interface IV2BottomDialogConfigData {
  // required
  title: {
    // required
    get: () => string,

    // optional
    data?: () => {
      [key: string]: string
    }
  };
  message: {
    // required
    get: () => string,

    // optional
    data?: () => {
      [key: string]: string
    }
  };
}

/**
 * Bottom dialog config
 */
export interface IV2BottomDialogConfig {
  // required
  config: IV2BottomDialogConfigData;
  bottomButtons: IV2BottomDialogConfigButton[];

  // optional
  dontCloseOnBackdrop?: boolean;
  initialized?: (handler: IV2BottomDialogHandler) => void;
}

/**
 * Dialog handler
 */
export interface IV2BottomDialogHandler {
  // required
  hide: () => void;
  detectChanges: () => void;
  loading: {
    show: (
      message?: string,
      messageData?: {
        [key: string]: string
      }
    ) => void,
    hide: () => void,
    message: (
      message: string,
      messageData?: {
        [key: string]: string
      }
    ) => void
  }
}

/**
 * Bottom dialog response
 */
export interface IV2BottomDialogResponse {
  // required
  button: {
    type: IV2BottomDialogConfigButtonType,
    key?: string
  };
}
