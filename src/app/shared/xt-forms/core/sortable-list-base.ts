import { ControlContainer } from '@angular/forms';
import { ListBase } from './list-base';
import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';
import { Directive } from "@angular/core";

/**
 * Base class to be extended by components that implement lists of group components or single components
 */
@Directive()
export abstract class SortableListBase<T> extends ListBase<T> {
    // invalid drag zone
    isInvalidDragEvent: boolean = true;

    /**
     * Constructor
     */
    protected constructor(
        controlContainer: ControlContainer,
        validators: Array<any>,
        asyncValidators: Array<any>
    ) {
        // parent
        super(
            controlContainer,
            validators,
            asyncValidators
        );
    }

    /**
     * Drop Item
     */
    abstract dropTable(event: CdkDragDrop<T[]>): void;

    /**
     * Drag started
     */
    abstract dragStarted(event: CdkDragStart<T>): void;

    /**
     * Started the drag from a zone that isn't allowed
     */
    notInvalidDragZone(): void {
        this.isInvalidDragEvent = false;
    }
}
