import { Component, Input, ViewEncapsulation } from '@angular/core';
import { AuditLogValue, AuditLogValueArrayAndObject, AuditLogValueWithoutArrayAndObject, FieldValueType, RichContentValue } from '../../types/field-value-type';

@Component({
  selector: 'app-field-changes',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './field-changes.component.html',
  styleUrls: ['./field-changes.component.less']
})
export class FieldChangesComponent {
  // value
  @Input() value: AuditLogValue;
  get valueAsNotObjectNotArray(): AuditLogValueWithoutArrayAndObject {
    return this.value as AuditLogValueWithoutArrayAndObject;
  }
  get valueAsObjectOrArray(): AuditLogValueArrayAndObject {
    return this.value as AuditLogValueArrayAndObject;
  }
  get valueAsRichContent(): RichContentValue {
    return this.value as RichContentValue;
  }

  // collapse diff? (for object and array type)
  collapsed: boolean = true;

  // provide constants to template
  FieldValueType = FieldValueType;
}

