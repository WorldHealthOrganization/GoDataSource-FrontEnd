import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { HoverRowActions, HoverRowActionsComponent } from '../../components';

@Directive({
    selector: '[app-hover-row-actions]',
    exportAs: 'HoverRowActions'
})
export class HoverRowActionsDirective {
    /**
     * Action Component
     */
    @Input() hoverRowActionsComponent: HoverRowActionsComponent;

    /**
     * Actions
     */
    @Input() hoverRowActions: HoverRowActions[] = [];

    /**
     * Actions Data
     */
    @Input() hoverRowActionData: any;

    /**
     * Constructor
     */
    constructor(
        private elementRef: ElementRef
    ) { }

    /**
     * Mouse enter row
     */
    @HostListener('mouseenter', ['$event'])
    mouseEnter(event) {
        // display actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.show(
                this.elementRef,
                this.hoverRowActions,
                this.hoverRowActionData,
                event
            );
        }
    }

    /**
     * Mouse move row
     */
    @HostListener('mousemove', ['$event'])
    mouseMove(event) {
        // display actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.updateMouseEvent(
                event
            );
        }
    }

    /**
     * Mouse click - for tablets
     */
    @HostListener('click', ['$event'])
    mouseClick(event) {
        // display actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.show(
                this.elementRef,
                this.hoverRowActions,
                this.hoverRowActionData,
                event
            );
        }
    }

    /**
     * Mouse left row
     */
    @HostListener('mouseleave', ['$event'])
    mouseLeave() {
        // hide actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.hide();
        }
    }
}
