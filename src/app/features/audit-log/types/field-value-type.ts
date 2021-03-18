export enum FieldValueType {
    BOOLEAN = 'boolean',
    NUMBER = 'number',
    STRING = 'string',
    LNG_TOKEN = 'language-token',
    RICH_CONTENT = 'rich-content',
    DATE = 'date',
    ARRAY = 'array',
    OBJECT = 'object'
}

export interface FieldValueDiff {
    property: string;
    oldValue: string;
    newValue: string;
}

export interface BooleanValue {
    type: FieldValueType.BOOLEAN;
    value: FieldValueDiff;
}

export interface NumberValue {
    type: FieldValueType.NUMBER;
    value: FieldValueDiff;
}

export interface StringValue {
    type: FieldValueType.STRING;
    value: FieldValueDiff;
}

export interface LanguageTokenValue {
    type: FieldValueType.LNG_TOKEN;
    value: FieldValueDiff;
}

export interface RichContentValue {
    type: FieldValueType.RICH_CONTENT;
    property: string;
}

export interface DateValue {
    type: FieldValueType.DATE;
    value: FieldValueDiff;
}

export interface ObjectValue {
    type: FieldValueType.OBJECT;
    rootProperty: string;
    value: AuditLogValue[];
}

export interface ArrayValue {
    type: FieldValueType.ARRAY;
    rootProperty: string;
    value: AuditLogValue[];
}

export type AuditLogValue = (BooleanValue | NumberValue | StringValue | LanguageTokenValue | RichContentValue | DateValue | ObjectValue | ArrayValue);
