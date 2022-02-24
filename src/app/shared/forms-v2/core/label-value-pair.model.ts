import * as _ from 'lodash';

export class LabelValuePairModel {
  // data
  public label: string;
  public value: any;
  public data?: any;
  public disabled?: boolean;
  public icon?: string;

  /**
   * Label / Value  pair constructor
   */
  constructor(
    data: {
      // required
      label: string,
      value: any,

      // optional
      data?: any,
      disabled?: boolean,
      icon?: string
    }
  ) {
    // set data
    this.label = data.label;
    this.value = data.value;
    this.data = data.data;
    this.disabled = data.disabled;
    this.icon = data.icon;
  }

  /**
   * Clone
   */
  clone(): LabelValuePairModel {
    return new LabelValuePairModel({
      label: this.label,
      value: this.value,
      data: this.data ?
        _.cloneDeep(this.data) :
        this.data,
      disabled: this.disabled,
      icon: this.icon
    });
  }
}
