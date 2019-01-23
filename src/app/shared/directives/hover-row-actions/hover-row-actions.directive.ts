import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { HoverRowActionsComponent } from '../../components';

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
     * Constructor
     */
    constructor(
        private elementRef: ElementRef
    ) { }

    /**
     * Mouse enter row
     */
    @HostListener('mouseenter', ['$event'])
    mouseEnter() {
        // display actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.show(this.elementRef);
        }
    }


    /**
     * Mouse click - for tablets
     */
    @HostListener('click', ['$event'])
    mouseClick() {
        // display actions
        if (this.hoverRowActionsComponent) {
            this.hoverRowActionsComponent.show(this.elementRef);
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
