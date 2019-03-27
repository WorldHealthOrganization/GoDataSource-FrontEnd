import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FieldChanges } from '../field-changes/typings/field-changes';
import * as _ from 'lodash';

@Component({
    selector: 'app-log-entry-changes',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './log-entry-changes.component.html',
    styleUrls: ['./log-entry-changes.component.less']
})
export class LogEntryChangesComponent {
    _value: FieldChanges[] = [];
    @Input() set value(val: FieldChanges[]) {
        this._value = val.filter((fieldChange: FieldChanges) => {
            // filter out empty values
            return (
                !_.isEmpty(fieldChange.oldValue) ||
                !_.isEmpty(fieldChange.newValue)
            );
        });
    }
    get value(): FieldChanges[] {
        return this._value;
    }
}

