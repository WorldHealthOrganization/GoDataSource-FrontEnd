import { Component, Input, ViewEncapsulation } from '@angular/core';
import { AuditLogValue, FieldValueType } from '../../types/field-value-type';

@Component({
    selector: 'app-field-changes',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './field-changes.component.html',
    styleUrls: ['./field-changes.component.less']
})
export class FieldChangesComponent {
    @Input() value: AuditLogValue;

    // collapse diff? (for object and array type)
    collapsed: boolean = true;

    // provide constants to template
    FieldValueType = FieldValueType;
}

