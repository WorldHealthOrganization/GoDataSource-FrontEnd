/**
 * Change value types
 */
export enum ChangeValueType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  LNG_TOKEN = 'language-token',
  RICH_CONTENT = 'rich-content',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object'
}

/**
 * Differences
 */
interface ChangeValueDiff {
  property: string;
  oldValue: string;
  newValue: string;
}

/**
 * Change Value - Boolean
 */
interface ChangeValueBoolean {
  // required
  type: ChangeValueType.BOOLEAN;
  value: ChangeValueDiff;
}

/**
 * Change Value - Number
 */
interface ChangeValueNumber {
  // required
  type: ChangeValueType.NUMBER;
  value: ChangeValueDiff;
}

/**
 * Change Value - String
 */
interface ChangeValueString {
  // required
  type: ChangeValueType.STRING;
  value: ChangeValueDiff;
}

/**
 * Change Value - Language Token
 */
interface ChangeValueLanguageToken {
  // required
  type: ChangeValueType.LNG_TOKEN;
  value: ChangeValueDiff;
}

/**
 * Change Value - Rich content
 */
interface ChangeValueRichContent {
  // required
  type: ChangeValueType.RICH_CONTENT;
  property: string;
}

/**
 * Change Value - Date
 */
interface ChangeValueDate {
  // required
  type: ChangeValueType.DATE;
  value: ChangeValueDiff;
}

/**
 * Change Value - Object
 */
export interface ChangeValueObject {
  // required
  type: ChangeValueType.OBJECT;
  rootProperty: string;
  value: ChangeValue[];

  // optional
  expanded?: boolean;
}

/**
 * Change Value - Array
 */
export interface ChangeValueArray {
  // required
  type: ChangeValueType.ARRAY;
  rootProperty: string;
  value: ChangeValue[];

  // optional
  expanded?: boolean;
}

// supported change value types
export type ChangeValue = ChangeValueBoolean | ChangeValueNumber | ChangeValueString | ChangeValueLanguageToken
| ChangeValueRichContent | ChangeValueDate | ChangeValueObject | ChangeValueArray;
