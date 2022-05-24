import * as _ from 'lodash';
import { DashboardKpiGroup } from '../enums/dashboard.enum';

export class DashletSettingsModel {
  name: string;
  kpiGroup: DashboardKpiGroup;
  order: number;
  visible: boolean;

  constructor(data = null) {
    this.name = _.get(data, 'name');
    this.kpiGroup = _.get(data, 'kpiGroup');
    this.order = _.get(data, 'order');
    this.visible = _.get(data, 'visible', true);
  }
}

export class UserSettingsDashboardModel {
  dashlets: DashletSettingsModel[];

  constructor(data = null) {
    this.dashlets = _.map(
      _.get(data, 'dashlets', []),
      (dashletData) => {
        return new DashletSettingsModel(dashletData);
      }
    );
  }
}
