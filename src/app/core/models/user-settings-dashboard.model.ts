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
    dashlets: any[];

    constructor(data = null) {
        this.dashlets = _.map(
            _.get(data, 'dashlets', []),
            (dashletData) => {
                return new DashletSettingsModel(dashletData);
            }
        );
    }

    /**
     * Get a specific dashlet's settings for current user
     * @param name
     */
    getDashlet(name: string): DashletSettingsModel {
        return _.find(this.dashlets, {name: name});
    }

    /**
     * Update an existing dashlet or add a new one
     * @param dashlet
     */
    addDashletIfNotExists(dashlet: DashletSettingsModel) {
        // does the dashlet exist in the list?
        const dashletObj = this.getDashlet(dashlet.name);

        if (!dashletObj) {
            // add order if missing
            if (!_.isNumber(dashlet.order)) {
                // find the next index for the same KPI Groupo
                dashlet.order = _.filter(this.dashlets, {kpiGroup: dashlet.kpiGroup}).length;
            }

            // add new dashlet
            this.dashlets.push(dashlet);
        }
    }

    /**
     * Hide a dashlet from list
     * @param name
     */
    hideDashlet(name: string) {
        const dashletObj: DashletSettingsModel = _.find(this.dashlets, {name: name});

        if (dashletObj) {
            // get the group that the dashlet belongs to
            const kpiGroup = dashletObj.kpiGroup;

            // hide the dashlet
            dashletObj.visible = false;

            // update the order of the other dashlets from the same group
            _.each(this.dashlets, (dashlet) => {
                if (
                    dashlet.kpiGroup === kpiGroup &&
                    dashlet.order > dashletObj.order
                ) {
                    // decrease order by 1
                    dashlet.order--;
                }
            });

            // update the order of the hidden dashlet (move it last in the list)
            dashletObj.order = _.filter(this.dashlets, {kpiGroup: kpiGroup}).length - 1;
        }
    }

    /**
     * Display all dashlets for a given KPI Group
     * @param kpiGroup
     */
    showAllDashlets(kpiGroup: string) {
        this.dashlets = _.map(this.dashlets, (dashlet) => {
            if (dashlet.kpiGroup === kpiGroup) {
                dashlet.visible = true;
            }

            return dashlet;
        });
    }

    moveDashletAfter(name: string) {
        const dashletObj: DashletSettingsModel = _.find(this.dashlets, {name: name});

        if (dashletObj) {
            // get the next dashlet from the same group (by order)
            const nextDashletObj: DashletSettingsModel = _.find(this.dashlets, {order: dashletObj.order + 1, kpiGroup: dashletObj.kpiGroup, visible: true});

            if (nextDashletObj) {
                // switch orders
                dashletObj.order++;
                nextDashletObj.order--;
            }
        }
    }

    moveDashletBefore(name: string) {
        const dashletObj: DashletSettingsModel = _.find(this.dashlets, {name: name});

        if (dashletObj) {
            // get the previous dashlet from the same group (by order)
            const previousDashletObj: DashletSettingsModel = _.find(this.dashlets, {order: dashletObj.order - 1, kpiGroup: dashletObj.kpiGroup, visible: true});

            if (previousDashletObj) {
                // switch orders
                dashletObj.order--;
                previousDashletObj.order++;
            }
        }
    }
}
