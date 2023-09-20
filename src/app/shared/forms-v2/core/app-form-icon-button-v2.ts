import { AppFormBaseV2 } from './app-form-base-v2';

export interface IAppFormIconButtonV2 {
  // required
  icon: string;

  // optional
  clickAction?: (input?: AppFormBaseV2<any>) => void;
  disabled?: (input?: AppFormBaseV2<any>) => boolean;
  visible?: (input?: AppFormBaseV2<any>) => boolean;
  tooltip?: string;
}
