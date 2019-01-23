import { Component, ElementRef, HostListener, Input, ViewChild, ViewEncapsulation } from '@angular/core';

/**
 * Rect handler since DomRect doesn't exist
 */
export class HoverRowActionsRect {
    top: number = 0;
    left: number = 0;
    width: number = 0;
    height: number = 0;
}

/**
 * Actions Position
 */
export enum HoverRowActionsPosition {
    LEFT = 'left',
    RIGHT = 'right'
}

/**
 * Hover component
 */
@Component({
    selector: 'app-hover-row-actions',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './hover-row-actions.component.html',
    styleUrls: ['./hover-row-actions.component.less']
})
export class HoverRowActionsComponent {
    /**
     * Constants
     */
    HoverRowActionsPosition = HoverRowActionsPosition;

    /**
     * Keep last reference element
     */
    elementRef: ElementRef;

    /**
     * hover row is visible ?
     */
    visible: boolean = false;

    /**
     * Show method called
     */
    visibleCaller: boolean = false;

    /**
     * Mouse inside actions div
     */
    visibleActions: boolean = false;

    /**
     * Hover row rect
     */
    hoverRowRect: HoverRowActionsRect = new HoverRowActionsRect();

    /**
     * Row style
     */
    hoverRowStyle: {
        [prop: string]: string
    } = {};

    /**
     * Hover actions rect
     */
    hoverActionsRect: HoverRowActionsRect = new HoverRowActionsRect();

    /**
     * Actions style
     */
    hoverActionsStyle: {
        [prop: string]: string
    } = {};

    /**
     * Actions Position
     */
    private _position: HoverRowActionsPosition = HoverRowActionsPosition.RIGHT;
    @Input() set position(position: HoverRowActionsPosition) {
        // set value
        this._position = position;

        // render again
        this.determineBounding();
    }
    get position(): HoverRowActionsPosition {
        return this._position;
    }

    /**
     * Component active ?
     */
    private _active: boolean = true;
    @Input() set active(active: boolean) {
        // set value
        this._active = active;

        // show / hide
        this.determineVisibleValue();
    }
    get active(): boolean {
        return this._active;
    }

    /**
     * Actions row
     */
    @ViewChild('actionsRow') actionsRow: ElementRef;

    /**
     * Determine row bounding
     */
    determineBounding() {
        // retrieve element bounding
        const bounding: HoverRowActionsRect = this.elementRef.nativeElement.getBoundingClientRect();

        // determine hover row bounding
        this.hoverRowRect.left = bounding.left;
        this.hoverRowRect.top = bounding.top;
        this.hoverRowRect.width = bounding.width;
        this.hoverRowRect.height = bounding.height;

        // determine hover actions bounding
        this.hoverActionsRect.top = bounding.top;
        this.hoverActionsRect.height = bounding.height;
        if (this.position === HoverRowActionsPosition.RIGHT) {
            // right
            this.hoverActionsRect.left = bounding.left + bounding.width;
        } else {
            // left
            this.hoverActionsRect.left = 0;
        }

        // determine row styles
        this.determineStyles();
    }

    /**
     * Determine row styles
     */
    determineStyles() {
        // set hover row style
        this.hoverRowStyle = {
            left: this.hoverRowRect.left + 'px',
            top: this.hoverRowRect.top + 'px',
            width: this.hoverRowRect.width + 'px',
            height: this.hoverRowRect.height + 'px'
        };

        // set hover actions style
        this.hoverActionsStyle = {
            left: this.hoverActionsRect.left + 'px',
            top: this.hoverActionsRect.top + 'px',
            height: this.hoverActionsRect.height + 'px'
        };
    }

    /**
     * Show hover row
     */
    show(elementRef: ElementRef) {
        // determine row bounding
        this.elementRef = elementRef;
        this.determineBounding();

        // set caller visibility
        this.visibleCaller = true;

        // check if we need to display row
        this.determineVisibleValue();
    }

    /**
     * Hide hover row
     */
    hide() {
        // set caller visibility
        this.visibleCaller = false;

        // check if we need to hide row
        this.determineVisibleValue();
    }

    /**
     * Mouse entered actions div
     */
    actionsMouseEnter() {
        // set actions visibility
        this.visibleActions = true;

        // check if we need to display row
        this.determineVisibleValue();
    }

    /**
     * Mouse left actions div
     */
    actionsMouseLeave() {
        // set actions visibility
        this.visibleActions = false;

        // check if we need to hide row
        this.determineVisibleValue();
    }

    /**
     * Determine visible value
     */
    determineVisibleValue() {
        // either user set this to true, or we are in actions view
        this.visible = this.active && (this.visibleCaller || this.visibleActions);
    }

    /**
     * Window Scroll
     */
    @HostListener('window:scroll', [])
    onWindowScroll() {
        console.log('scroll');
    }
}
