import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FieldChanges } from './typings/field-changes';
import { FieldValueType } from './typings/field-value-type';

@Component({
    selector: 'app-field-changes',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './field-changes.component.html',
    styleUrls: ['./field-changes.component.less']
})
export class FieldChangesComponent {
    _value: FieldChanges;
    @Input() set value(val: FieldChanges) {
        this._value = val;

        this.getFieldValueType();
    }
    get value(): FieldChanges {
        return this._value;
    }

    valueType: FieldValueType;

    // provide constants to template
    FieldValueType = FieldValueType;

    private getFieldValueType() {
        if (typeof this.value.newValue === 'string') {
            // language token?
            if (
                (
                    this.value.oldValue &&
                    this.value.oldValue.startsWith('LNG_')
                ) ||
                (
                    this.value.newValue &&
                    this.value.newValue.startsWith('LNG_')
                )
            ) {
                this.valueType = FieldValueType.LNG_TOKEN;
                return;
            }

            // date?
            if (
                (new Date(this.value.oldValue)).getTime() > 0 ||
                (new Date(this.value.newValue)).getTime() > 0
            ) {
                this.valueType = FieldValueType.DATE;
                return;
            }

            this.valueType = FieldValueType.STRING;
            return;
        }

        if (Array.isArray(this.value.newValue)) {
            this.valueType = FieldValueType.ARRAY;
            return;
        }

        this.valueType = FieldValueType.OBJECT;
    }
}

