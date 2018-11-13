import { DateDefaultPipe } from './date-default-pipe/date-default.pipe';
import { DateTimeDefaultPipe } from './date-time-default-pipe/date-time-default.pipe';
import { DateShortPipePipe } from './date-short-pipe/date-short-pipe.pipe';

// export the list of all directives
export const pipes: any[] = [
    DateDefaultPipe,
    DateTimeDefaultPipe,
    DateShortPipePipe
];

