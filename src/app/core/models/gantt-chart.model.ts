import { IPermissionGanttChart } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class GanttChartModel
    implements
        IPermissionGanttChart {

    /**
     * Static Permissions - IPermissionGanttChart
     */
    static canViewDelayOnsetLabTesting(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_LAB_TESTING) : false; }
    static canViewDelayOnsetHospitalization(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_HOSPITALIZATION) : false; }
    static canExportDelayOnsetLabTesting(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.GANTT_CHART_EXPORT_DELAY_ONSET_LAB_TESTING) : false; }
    static canExportDelayOnsetHospitalization(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.GANTT_CHART_EXPORT_DELAY_ONSET_HOSPITALIZATION) : false; }

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Permissions - IPermissionGanttChart
     */
    canViewDelayOnsetLabTesting(user: UserModel): boolean { return GanttChartModel.canViewDelayOnsetLabTesting(user); }
    canViewDelayOnsetHospitalization(user: UserModel): boolean { return GanttChartModel.canViewDelayOnsetHospitalization(user); }
    canExportDelayOnsetLabTesting(user: UserModel): boolean { return GanttChartModel.canExportDelayOnsetLabTesting(user); }
    canExportDelayOnsetHospitalization(user: UserModel): boolean { return GanttChartModel.canExportDelayOnsetHospitalization(user); }
}
