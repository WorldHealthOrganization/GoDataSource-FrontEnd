import { DateDefaultPipe } from './date-default-pipe/date-default.pipe';
import { DateTimeDefaultPipe } from './date-time-default-pipe/date-time-default.pipe';
import { SafeHtmlPipe } from './safe-html-pipe/safe-html.pipe';
import { HighlightSearchPipe } from './highlight-search/highlight-search';

// export the list of all directives
export const pipes: any[] = [
    DateDefaultPipe,
    DateTimeDefaultPipe,
    SafeHtmlPipe,
    HighlightSearchPipe
];

