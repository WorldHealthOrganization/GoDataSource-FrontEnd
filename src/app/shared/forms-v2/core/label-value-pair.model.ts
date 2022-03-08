export interface ILabelValuePairModel {
  // required
  label: string;
  value: any;

  // optional
  data?: any;
  disabled?: boolean;
  icon?: string;
}
