import * as momentOriginal from 'moment';
import { Moment as MomentOriginal, MomentBuiltinFormat as MomentBuiltinFormatOriginal } from 'moment';
import * as _ from 'lodash';

/**
 * Types
 */
export type Moment = MomentOriginal;
export type MomentBuiltinFormat = MomentBuiltinFormatOriginal;

// overwrite constructor
export function moment(inp?: momentOriginal.MomentInput, format?: momentOriginal.MomentFormatSpecification, strict?: boolean): Moment {
    // make sure we have a date
    let date: MomentOriginal;
    if (_.isString(inp)) {
        date = inp.endsWith('Z') ?
            momentOriginal.utc(inp, format, strict) :
            momentOriginal(inp, format, strict);
    } else if (!(inp instanceof momentOriginal)) {
        date = momentOriginal(inp, format, strict);
    } else {
        date = inp as MomentOriginal;
    }

    // do we have a valid date ?
    if (!date.isValid()) {
        return date;
    }

    // make sure we return utc time
    return date instanceof momentOriginal && date.isUTC() ?
        date :
        momentOriginal.utc(date.format('YYYY-MM-DD'));
}

// extra functionality
moment.utc = momentOriginal.utc;
moment.ISO_8601 = momentOriginal.ISO_8601;
moment.duration = momentOriginal.duration;
