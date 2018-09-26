/**
 * Visible column
 */
export class VisibleColumnModel {
    // required
    field: string;

    // optional
    label: string;
    required: boolean = false;
    visible: boolean = true;
    excludeFromSave: boolean = false;

    /**
     * Constructor
     * @param data
     */
    constructor(data: {
        // required
        field: string,

        // optional
        label?: string,
        required?: boolean,
        visible?: boolean,
        excludeFromSave?: boolean
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }
}

