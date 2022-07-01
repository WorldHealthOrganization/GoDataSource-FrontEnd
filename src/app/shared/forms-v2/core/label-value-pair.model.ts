import { IInfoIcon } from './info-icon.model';

export interface ILabelValuePairModel {
  // required
  label: string;
  value: any;

  // optional
  data?: any;
  disabled?: boolean;
  order?: number;
  icon?: string;
  iconUrl?: string;
  infos?: IInfoIcon[];
  color?: string;
}
