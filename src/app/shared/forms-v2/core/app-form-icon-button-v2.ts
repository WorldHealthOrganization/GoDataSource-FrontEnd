export class AppFormIconButtonV2 {
  icon: string;
  clickAction: () => void;

  /**
   * Constructor
   */
  constructor(data: {
    // required
    icon: string,

    // optional
    clickAction?: () => void
  }) {
    this.icon = data.icon;
    this.clickAction = data.clickAction;
  }
}
