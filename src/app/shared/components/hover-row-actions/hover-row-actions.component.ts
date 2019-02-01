import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';

/**
 * Action Type
 */
export enum HoverRowActionsType {
    BUTTON = 'button',
    MENU = 'menu',
    DIVIDER = 'divider'
}

/**
 * Action
 */
export class HoverRowActions {
    // fields
    type: HoverRowActionsType = HoverRowActionsType.BUTTON;
    icon: string;
    click: (item: any) => void;
    class: string;

    menuOptions: HoverRowActions[];
    menuOptionLabel: string;

    /**
     * Constructor
     */
    constructor(data: {
        // optional
        icon?: string,
        click?: (item: any) => void,
        type?: HoverRowActionsType,
        menuOptions?: HoverRowActions[],
        menuOptionLabel?: string,
        class?: string
    }) {
        Object.assign(this, data);
    }
}

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
    RIGHT = 'right',
    CLOSEST = 'closest'
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
export class HoverRowActionsComponent implements OnInit, OnDestroy {
    /**
     * Constants
     */
    HoverRowActionsPosition = HoverRowActionsPosition;
    HoverRowActionsType = HoverRowActionsType;

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
    private _position: HoverRowActionsPosition = HoverRowActionsPosition.CLOSEST;
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
     * Real position
     */
    get realPosition(): HoverRowActionsPosition {
        // determine real position
        let position: HoverRowActionsPosition;
        if (
            this.position === HoverRowActionsPosition.CLOSEST &&
            this.mouseEvent &&
            this.elementRef
        ) {
            const bounding: HoverRowActionsRect = this.elementRef.nativeElement.getBoundingClientRect();
            const leftDistance = this.mouseEvent.clientX - bounding.left;
            const rightDistance = bounding.left + bounding.width - this.mouseEvent.clientX;
            if (leftDistance < rightDistance) {
                // left
                position = HoverRowActionsPosition.LEFT;
            } else {
                // right
                position = HoverRowActionsPosition.RIGHT;
            }
        } else if (this.position === HoverRowActionsPosition.LEFT) {
            position = HoverRowActionsPosition.LEFT;
        } else {
            position = HoverRowActionsPosition.RIGHT;
        }

        // set rendered actions
        if (position === HoverRowActionsPosition.RIGHT) {
            this.realActions = this.actions;
        } else {
            this.realActions = this.actionsReversed;
        }

        // return real position
        return position;
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
     * Used to keep function scope
     */
    onWindowScrollArrow;

    /**
     * Used to keep function scope
     */
    onWindowResizeArrow;

    /**
     * Actions
     */
    actions: HoverRowActions[] = [];

    /**
     * Actions reversed
     */
    actionsReversed: HoverRowActions[] = [];

    /**
     * Actions rendered
     */
    realActions: HoverRowActions[] = [];

    /**
     * Action data
     */
    actionData: any;

    /**
     * Mouse event data
     */
    mouseEvent: MouseEvent;

    /**
     * Component initialized
     */
    ngOnInit() {
        // init arrow function
        this.onWindowScrollArrow = () => {
            this.onWindowScroll();
        };
        this.onWindowResizeArrow = () => {
            this.onWindowResize();
        };

        // register listeners
        window.addEventListener('scroll', this.onWindowScrollArrow, true);
        window.addEventListener('resize', this.onWindowResizeArrow, true);
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        window.removeEventListener('scroll', this.onWindowScrollArrow, true);
        window.removeEventListener('resize', this.onWindowResizeArrow, true);
    }

    /**
     * Determine row bounding
     */
    determineBounding() {
        // nothing to do ?
        if (!this.elementRef) {
            return;
        }

        // retrieve element bounding
        const bounding: HoverRowActionsRect = this.elementRef.nativeElement.getBoundingClientRect();

        // determine hover row bounding
        this.hoverRowRect.left = bounding.left;
        this.hoverRowRect.top = bounding.top;
        this.hoverRowRect.width = bounding.width;
        this.hoverRowRect.height = bounding.height;

        // determine hover actions bounding
        this.hoverActionsRect.top = bounding.top;
        this.hoverActionsRect.height = bounding.height - 1;
        switch (this.realPosition) {
            // left
            case HoverRowActionsPosition.LEFT:
                this.hoverActionsRect.left = bounding.left;
                break;

            // right
            case HoverRowActionsPosition.RIGHT:
                this.hoverActionsRect.left = bounding.left + bounding.width;
                break;
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
     * Update Mouse event
     */
    updateMouseEvent(mouseEvent: MouseEvent) {
        this.mouseEvent = mouseEvent;
        this.determineBounding();
    }

    /**
     * Show hover row
     */
    show(
        elementRef: ElementRef,
        actions: HoverRowActions[],
        actionData: any = null,
        mouseEvent: MouseEvent = null
    ) {
        // set actions
        if (!_.isEqual(this.actions, actions)) {
            this.actions = actions;
            this.actionsReversed = actions ? _.cloneDeep(actions).reverse() : [];
        }

        // set data
        this.actionData = actionData;

        // keep mouse event
        this.mouseEvent = mouseEvent;

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
     * Hide row
     */
    hideEverything() {
        // hide hover
        this.hide();
        this.actionsMouseLeave();
    }

    /**
     * Window scroll
     */
    onWindowScroll() {
        this.hideEverything();
    }

    /**
     * Window resize
     */
    onWindowResize() {
        this.hideEverything();
    }
}
