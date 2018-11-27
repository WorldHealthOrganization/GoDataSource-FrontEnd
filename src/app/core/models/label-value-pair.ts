
export class LabelValuePair {
    constructor(
        public label: string,
        public value: any,
        public disabled: boolean = false,
        public visible: boolean = true,
        public iconUrl?: string
    ) {}
}
