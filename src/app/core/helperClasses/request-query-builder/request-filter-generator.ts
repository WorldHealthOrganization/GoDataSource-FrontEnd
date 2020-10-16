import * as _ from 'lodash';
import { moment } from '../x-moment';

export class RequestFilterGenerator {
    /**
     * Escape string
     * @param value
     */
    static escapeStringForRegex(value: string) {
        return value.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );
    }

    /**
     * Text is exactly the provided value ( case insensitive )
     * @param value
     */
    static textIs(value: string): any {
        return {
            regexp: '/^' +
                RequestFilterGenerator.escapeStringForRegex(value)
                    .replace(/%/g, '.*')
                    .replace(/\\\?/g, '.')
                    .replace(/&/g, '%26')
                    .replace(/#/g, '%23')
                    .replace(/\+/g, '%2B') +
                '$/i'
        };
    }

    /**
     * Text contains the provided value ( case insensitive )
     * @param value
     */
    static textContains(value: string): any {
        return {
            regexp: '/' +
                RequestFilterGenerator.escapeStringForRegex(value)
                    .replace(/%/g, '.*')
                    .replace(/\\\?/g, '.')
                    .replace(/&/g, '%26')
                    .replace(/#/g, '%23')
                    .replace(/\+/g, '%2B') +
                '/i'
        };
    }

    /**
     * Text starts with provided value ( case insensitive )
     */
    static textStartWith(
        value: string,
        useLike?: boolean
    ): any {
        return useLike ?
            {
                like: '^' +
                    RequestFilterGenerator.escapeStringForRegex(value)
                        .replace(/%/g, '.*')
                        .replace(/\\\?/g, '.')
                        .replace(/&/g, '%26')
                        .replace(/#/g, '%23')
                        .replace(/\+/g, '%2B'),
                options: 'i'
            } : {
                regexp: '/^' +
                    RequestFilterGenerator.escapeStringForRegex(value)
                        .replace(/%/g, '.*')
                        .replace(/\\\?/g, '.')
                        .replace(/&/g, '%26')
                        .replace(/#/g, '%23')
                        .replace(/\+/g, '%2B') +
                    '/i'
            };
    }

    /**
     * Compare with range of numbers or iso dates
     * @param value
     * @returns null if invalid data is provided, filter object otherwise
     */
    static rangeCompare(value: {
        from?: number | string,
        to?: number | string
    }) {
        // data
        const fromValue = _.get(value, 'from');
        const toValue = _.get(value, 'to');
        const fromValueIsEmpty: boolean = !_.isNumber(fromValue) && _.isEmpty(fromValue);
        const toValueIsEmpty: boolean = !_.isNumber(toValue) && _.isEmpty(toValue);

        // determine operator & value
        let operator;
        let valueToCompare;
        if (!fromValueIsEmpty && !toValueIsEmpty) {
            operator = 'between';
            valueToCompare = [fromValue, toValue];
        } else if (!fromValueIsEmpty) {
            operator = 'gte';
            valueToCompare = fromValue;
        } else if (!toValueIsEmpty) {
            operator = 'lte';
            valueToCompare = toValue;
        } else {
            return null;
        }

        // filter
        return {
            [operator]: valueToCompare
        };
    }

    /**
     * Compare with range of dates
     * @param value
     */
    static dateRangeCompare(value: {
        startDate?: any,
        endDate?: any
    }) {
        // convert date range to simple range
        const rangeValue: any = {};
        if (value.startDate) {
            rangeValue.from = value.startDate.toISOString ? value.startDate.toISOString() : moment(value.startDate).toISOString();
        }
        if (value.endDate) {
            rangeValue.to = value.endDate.toISOString ? value.endDate.toISOString() : moment(value.endDate).toISOString();
        }

        // filter
        return this.rangeCompare(
            rangeValue
        );
    }

    /**
     * Check if field has value
     */
    static hasValue() {
        // since some mongo filters don't work with $neq null / $eq null, we need to find different solution
        return {
            exists: true,
            not: {
                $type: 'null'
            },
            $ne: ''
        };
    }

    /**
     * Check if field doesn't have value
     * @param field
     */
    static doesntHaveValue(
        field: string,
        forMongo: boolean = false
    ) {
        // since some mongo filters don't work with $neq null / $eq null, we need to find different solution
        return forMongo ? {
            $or: [
                {
                    [field]: {
                        $exists: false
                    }
                }, {
                    [field]: {
                        $type: 'null'
                    }
                }, {
                    [field]: {
                        $eq: ''
                    }
                }
            ]
        } : {
            or: [
                {
                    [field]: {
                        exists: false
                    }
                }, {
                    [field]: {
                        type: 'null'
                    }
                }, {
                    [field]: {
                        eq: ''
                    }
                }
            ]
        };
    }
}
