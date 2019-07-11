import * as momentOriginal from 'moment';
import { Moment as MomentOriginal, MomentBuiltinFormat as MomentBuiltinFormatOriginal } from 'moment';

/**
 * Types
 */
export type Moment = MomentOriginal;
export type MomentBuiltinFormat = MomentBuiltinFormatOriginal;

// overwrite constructor
export function moment(inp?: momentOriginal.MomentInput, format?: momentOriginal.MomentFormatSpecification, strict?: boolean): Moment {
    return momentOriginal.utc(momentOriginal(inp, format, strict).format('YYYY-MM-DD'));
}

// extra functionality
moment.utc = momentOriginal.utc;
moment.ISO_8601 = momentOriginal.ISO_8601;
moment.duration = momentOriginal.duration;
