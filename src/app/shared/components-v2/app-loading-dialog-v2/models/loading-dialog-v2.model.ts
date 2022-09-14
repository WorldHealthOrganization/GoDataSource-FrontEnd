/**
 * Loading dialog data
 */
export interface IV2LoadingDialogData {
  // required
  message: string;

  // optional
  messageData?: {
    [key: string]: string
  };
}

/**
 * Loading dialog handler
 */
export interface IV2LoadingDialogHandler {
  // required
  readonly data: IV2LoadingDialogData;
  readonly close: () => void;
  readonly message: (data: IV2LoadingDialogData) => void;
}
