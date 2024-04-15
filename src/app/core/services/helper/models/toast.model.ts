/**
 * Toast type
 */
export enum ToastV2Type {
  ERROR,
  SUCCESS,
  NOTICE
}

/**
 * Toast base
 */
interface IToastV2Base {
  // required
  type: ToastV2Type;
}

/**
 * Toast - error
 */
interface IToastV2Error extends IToastV2Base {
  // required
  type: ToastV2Type.ERROR;
  err: { code: string, message?: string } | string;
  translateData: {
    [key: string]: string
  };
  messageId: string;
  details: string;
}

/**
 * Toast - success
 */
interface IToastV2Success extends IToastV2Base {
  // required
  type: ToastV2Type.SUCCESS;
  message: string;
  translateData: {
    [key: string]: string
  };
  messageId: string;
}

/**
 * Toast - notice
 */
interface IToastV2Notice extends IToastV2Base {
  // required
  type: ToastV2Type.NOTICE;
  message: string;
  translateData: {
    [key: string]: string
  };
  messageId: string;
}

/**
 * Toast
 */
export type IToastV2 = IToastV2Error | IToastV2Success | IToastV2Notice;
