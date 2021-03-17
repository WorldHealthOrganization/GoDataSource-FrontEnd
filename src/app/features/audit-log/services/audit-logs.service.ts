import { Injectable } from '@angular/core';
import { ArrayValue, AuditLogValue, FieldValueType, ObjectValue, RichContentValue } from '../types/field-value-type';
import { Constants } from '../../../core/models/constants';
import { AuditLogChangeDataModel } from '../../../core/models/audit-log.model';
import * as _ from 'lodash';

@Injectable()
export class AuditLogsService {
    /**
     * Get Field value
     */
    getFieldValue(
        changedData: AuditLogChangeDataModel,
        recordType: string
    ): AuditLogValue | null {
        // get changed value data type
        const changedValueType: FieldValueType = this.getChangedDataType(
            changedData,
            recordType
        );

        // get changed value in proper format for being displayed in UI
        switch (changedValueType) {
            case FieldValueType.BOOLEAN:
            case FieldValueType.NUMBER:
            case FieldValueType.STRING:
            case FieldValueType.LNG_TOKEN:
            case FieldValueType.DATE:
                if (
                    // omit empty values
                    (
                        (
                            changedData.newValue === undefined ||
                            changedData.newValue === null ||
                            changedData.newValue === ''
                        ) &&
                        (
                            changedData.oldValue === undefined ||
                            changedData.oldValue === null ||
                            changedData.oldValue === ''
                        )
                    ) ||
                    // omit identical values
                    (changedData.newValue === changedData.oldValue)
                ) {
                    return null;
                }

                return {
                    type: changedValueType,
                    value: {
                        property: changedData.field,
                        newValue: changedData.newValue,
                        oldValue: changedData.oldValue,
                    }
                } as AuditLogValue;

            case FieldValueType.RICH_CONTENT:
                return {
                    type: changedValueType,
                    property: changedData.field,
                } as RichContentValue;

            case FieldValueType.OBJECT:
            case FieldValueType.ARRAY:
                const fieldValue: ObjectValue | ArrayValue = {
                    type: changedValueType,
                    rootProperty: changedData.field,
                    value: []
                } as (ObjectValue | ArrayValue);

                // add all child properties and their changed values
                const addedProperties = [];

                // define method to collect properties and values from an object or array
                const collectFieldValues = (valueObject) => {
                    for (const prop in valueObject) {
                        if (!addedProperties.includes(prop)) {
                            addedProperties.push(prop);
                            const propFieldValue = this.getFieldValue(
                                new AuditLogChangeDataModel({
                                    field: prop,
                                    newValue: _.get(changedData.newValue, prop, ''),
                                    oldValue: _.get(changedData.oldValue, prop, '')
                                }),
                                recordType
                            );
                            // add value to the list of not empty
                            if (propFieldValue !== null) {
                                fieldValue.value.push(propFieldValue);
                            }
                        }
                    }
                };

                // collect properties from 'newValue' and 'oldValue'
                collectFieldValues(changedData.newValue);
                collectFieldValues(changedData.oldValue);

                // did we collect any properties?
                if (fieldValue.value.length === 0) {
                    return null;
                }

                return fieldValue;
        }

        return null;
    }

    /**
     * Get value type
     */
    private getChangedDataType(
        changedData: AuditLogChangeDataModel,
        recordType: string
    ): FieldValueType {
        // get data type based on newValue or oldValue (if newValue is empty)
        let relevantValue = changedData.newValue;
        if (
            changedData.newValue === undefined ||
            changedData.newValue === null ||
            changedData.newValue === ''
        ) {
            relevantValue = changedData.oldValue;
        }

        // string ?
        if (
            typeof relevantValue === 'string'
        ) {
            // do not translate fields: 'id', 'token'
            if (
                changedData.field === 'id' ||
                changedData.field === 'token'
            ) {
                return FieldValueType.STRING;
            }

            // do not try to display rich content
            if (
                (
                    recordType === Constants.DATA_MODULES.HELP_ITEM.value &&
                    (
                        changedData.field === 'content' ||
                        changedData.field === 'translation'
                    )
                ) ||
                (
                    recordType === Constants.DATA_MODULES.LANGUAGE_TOKEN.value &&
                    changedData.field === 'translation'
                )
            ) {
                return FieldValueType.RICH_CONTENT;
            }

            // language token?
            if (relevantValue.startsWith('LNG_')) {
                return FieldValueType.LNG_TOKEN;
            }

            // date?
            if (new Date(relevantValue).getTime() > 0) {
                return FieldValueType.DATE;
            }

            return FieldValueType.STRING;
        }

        // boolean ?
        if (typeof relevantValue === 'boolean') {
            return FieldValueType.BOOLEAN;
        }

        // number ?
        if (typeof relevantValue === 'number') {
            return FieldValueType.NUMBER;
        }

        // array
        if (Array.isArray(relevantValue)) {
            return FieldValueType.ARRAY;
        }

        // object
        if (typeof relevantValue === 'object') {
            return FieldValueType.OBJECT;
        }
    }
}
