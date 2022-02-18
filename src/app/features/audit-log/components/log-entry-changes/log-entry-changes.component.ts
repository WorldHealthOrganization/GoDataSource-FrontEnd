import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuditLogChangeDataModel, AuditLogModel } from '../../../../core/models/audit-log.model';
import { AuditLogValue } from '../../types/field-value-type';
import { AuditLogsService } from '../../services/audit-logs.service';

@Component({
  selector: 'app-log-entry-changes',
  templateUrl: './log-entry-changes.component.html'
})
export class LogEntryChangesComponent implements OnChanges {
  // value
  @Input() value: AuditLogModel;

  // log values
  logValues: AuditLogValue[] = [];

  /**
     * Constructor
     */
  constructor(
    private auditLogsService: AuditLogsService
  ) {}

  /**
     * On changes listener
     */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      this.logValues = changes.value.currentValue.changedData
        .map((changedData: AuditLogChangeDataModel) => {
          return this.auditLogsService.getFieldValue(
            changedData,
            changes.value.currentValue.modelName
          );
        })
      // filter out empty values
        .filter((fieldValue: AuditLogValue) => fieldValue !== null);
    }
  }
}

