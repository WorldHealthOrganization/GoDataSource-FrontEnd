import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { AuditLogChangeDataModel, AuditLogModel } from '../../../../core/models/audit-log.model';
import { AuditLogValue } from '../../types/field-value-type';
import { AuditLogsService } from '../../services/audit-logs.service';

@Component({
    selector: 'app-log-entry-changes',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './log-entry-changes.component.html',
    styleUrls: ['./log-entry-changes.component.less']
})
export class LogEntryChangesComponent implements OnChanges {
    @Input() value: AuditLogModel;

    logValues: AuditLogValue[] = [];

    constructor(
        private auditLogsService: AuditLogsService
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.value) {
            this.logValues = changes.value.currentValue.changedData
                .filter((changedData: AuditLogChangeDataModel) => {
                    // filter out empty values
                    return (
                        !_.isEmpty(changedData.oldValue) ||
                        !_.isEmpty(changedData.newValue)
                    );
                })
                .map((changedData: AuditLogChangeDataModel) => {
                    return this.auditLogsService.getFieldValue(changedData, changes.value.currentValue.modelName);
                })
                // filter out empty values
                .filter((fieldValue: AuditLogValue) => fieldValue !== null);
        }
    }
}

