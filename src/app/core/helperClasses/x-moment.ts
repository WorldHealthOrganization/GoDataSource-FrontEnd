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
        date = inp.endsWith('Z') || inp.includes('GMT') ?
            momentOriginal.utc(inp, format, strict) :
            momentOriginal(inp, format, strict);
    } else if (!(inp instanceof momentOriginal)) {
        date = momentOriginal(inp, format, strict);
    } else {
        date = (inp as MomentOriginal).clone();
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

/**
 * Convert date diff to readable format
 */
function setDiffTimeString(diffDuration: moment.duration): string {
    const str = [];
    diffDuration.years() > 0 ? str.push(`${diffDuration.years()}y`) : null;
    diffDuration.months() > 0 ? str.push(`${diffDuration.months()}M`) : null;
    diffDuration.days() > 0 ? str.push(`${diffDuration.days()}d`) : null;
    diffDuration.hours() > 0 ? str.push(`${diffDuration.hours()}h`) : null;
    diffDuration.minutes() > 0 ? str.push(`${diffDuration.minutes()}m`) : null;
    diffDuration.seconds() > 0 ? str.push(`${diffDuration.seconds()}s`) : null;

    // return response
    return str.join(' ');
}

// extra functionality
moment.utc = momentOriginal.utc;
moment.ISO_8601 = momentOriginal.ISO_8601;
moment.duration = momentOriginal.duration;
moment.setDiffTimeString = setDiffTimeString;
