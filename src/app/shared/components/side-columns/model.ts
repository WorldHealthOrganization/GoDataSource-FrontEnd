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
    excludeFromDisplay: (VisibleColumnModel) => boolean;

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
        excludeFromSave?: boolean,
        excludeFromDisplay?: (VisibleColumnModel) => boolean
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }
}

