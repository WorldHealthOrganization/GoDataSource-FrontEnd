export interface IGanttDataInterface {
    id: string;
    type: 'group';
    text: string;
    start: Date;
    end: Date;
    links: [{
        target: string,
        type: 'SF'
    }] | undefined;
}
