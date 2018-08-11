/**
 * class ElementBaseFailure
 * Allow to set both message token and translate data for validation messages
 */
export class ElementBaseFailure {
    constructor (
        public messageToken: string,
        public messageData: { [key: string]: string } = {}
    ) {}
}
