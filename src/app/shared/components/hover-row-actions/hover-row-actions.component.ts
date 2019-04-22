import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

/**
 * Action Type
 */
export enum HoverRowActionType {
    BUTTON = 'button',
    MENU = 'menu',
    DIVIDER = 'divider'
}

/**
 * Action
 */
export class HoverRowAction {
    // fields
    type: HoverRowActionType = HoverRowActionType.BUTTON;
    icon: string;
    iconTooltip: string;
    iconTooltipTranslateData: (item: any) => {
        [key: string]: any
    };
    click: (item: any, handler: any) => void;
    class: string;
    visible: (item: any) => boolean;

    menuOptions: HoverRowAction[];
    menuOptionLabel: string;
    menuOptionLabelTranslateData: (item: any) => {
        [key: string]: any
    };

    /**
     * Constructor
     */
    constructor(data: {
        // optional
        icon?: string,
        iconTooltip?: string,
        iconTooltipTranslateData?: (item: any) => {
            [key: string]: any
        },
        click?: (item: any, handler: any) => void,
        type?: HoverRowActionType,
        menuOptions?: HoverRowAction[],
        menuOptionLabel?: string,
        menuOptionLabelTranslateData?: (item: any) => {
            [key: string]: any
        },
        class?: string,
        visible?: (item: any) => boolean
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
     * Minimum distance between current mouse cursor position and previous one to be taken in consideration ( to rerender data )
     */
    static readonly MIN_MOUSE_DISTANCE: number = 30;

    /**
     * During this time actions are inactive
     */
    static readonly ACTIONS_DEAD_TIME_SINCE_SHOWN_MS: number = 400;

    /**
     * Keep shown time
     */
    private shownTime: number = 0;

    /**
     * Constants
     */
    HoverRowActionsPosition = HoverRowActionsPosition;
    HoverRowActionType = HoverRowActionType;

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
     * Left side class
     */
    @Input() leftSideClass: string = '';

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
    realPosition: HoverRowActionsPosition = HoverRowActionsPosition.LEFT;

    /**
     * Component active ?
     */
    private _active: boolean = true;
    @Input() set active(active: boolean) {
        // set value
        this._active = active;

        // show / hide
        this.determineVisibleValue();

        // determine row bounding
        if (this.active) {
            setTimeout(() => {
                this.determineBounding();
            });
        }
    }
    get active(): boolean {
        return this._active;
    }

    /**
     * Retrieve classes
     */
    get rowClasses(): {
        [className: string]: boolean
    } {
        // default classes
        const classes = {
            'record-hover-actions': true
        };

        // add left side class
        if (
            !!this.leftSideClass &&
            this.realPosition === HoverRowActionsPosition.LEFT
        ) {
            classes[this.leftSideClass] = true;
        }

        // finished
        return classes;
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
    actions: HoverRowAction[] = [];

    /**
     * Actions reversed
     */
    actionsReversed: HoverRowAction[] = [];

    /**
     * Actions rendered
     */
    realActions: HoverRowAction[] = [];

    /**
     * Action data
     */
    actionData: any;

    /**
     * Action handler
     */
    actionHandler: any;

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
     * Determine scroll position
     */
    determineParentScrollX(): number {
        // determine scroll position
        let scrolledX: number = 0;
        let parent = this.elementRef.nativeElement;
        while (parent) {
            scrolledX += parent.scrollLeft;
            parent = parent.parentElement;
        }

        // finished
        return scrolledX;
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
        const scrolledX: number = this.determineParentScrollX();
        this.hoverRowRect.left = scrolledX + bounding.left;
        this.hoverRowRect.top = bounding.top;
        this.hoverRowRect.width = bounding.width;
        this.hoverRowRect.height = bounding.height;

        // determine hover actions bounding
        this.hoverActionsRect.top = bounding.top;
        this.hoverActionsRect.height = bounding.height - 1;
        switch (this.realPosition) {
            // left
            case HoverRowActionsPosition.LEFT:
                this.hoverActionsRect.left = bounding.left + scrolledX;
                break;

            // right
            case HoverRowActionsPosition.RIGHT:
                this.hoverActionsRect.left = bounding.left + bounding.width + scrolledX;
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
        // don't update that frequently...
        if (
            this.mouseEvent &&
            mouseEvent &&
            Math.abs(this.mouseEvent.clientX - mouseEvent.clientX) < HoverRowActionsComponent.MIN_MOUSE_DISTANCE
        ) {
            return;
        }

        // update mouse position
        this.mouseEvent = mouseEvent;

        // determine real position
        this.updateRealPosition();

        // update bounding
        this.determineBounding();
    }

    /**
     * Show hover row
     */
    show(
        handler: any,
        elementRef: ElementRef,
        actions: HoverRowAction[],
        actionData: any = null,
        mouseEvent: MouseEvent = null
    ) {
        // set actions
        if (!_.isEqual(this.actions, actions)) {
            this.actions = actions;
            this.actionsReversed = actions ? _.cloneDeep(actions).reverse() : [];
        }

        // set handler
        this.actionHandler = handler;

        // set data
        this.actionData = actionData;

        // keep mouse event
        this.mouseEvent = mouseEvent;

        // determine row bounding
        this.elementRef = elementRef;

        // determine real position
        this.updateRealPosition();

        // determine bounding
        this.determineBounding();

        // set caller visibility
        this.visibleCaller = true;

        // check if we need to display row
        this.determineVisibleValue();

        // set shown time
        this.shownTime = moment().valueOf();
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

    /**
     * Clicked Button or Menu option
     * @param buttonData
     */
    clickedButton(buttonData: HoverRowAction) {
        // actions disabled ?
        if ((moment().valueOf() - this.shownTime) <= HoverRowActionsComponent.ACTIONS_DEAD_TIME_SINCE_SHOWN_MS) {
            return;
        }

        // perform action
        buttonData.click(
            this.actionData,
            this.actionHandler
        );
    }

    /**
     * Update Real position
     */
    private updateRealPosition() {
        // determine real position
        let position: HoverRowActionsPosition;
        if (
            this.position === HoverRowActionsPosition.CLOSEST &&
            this.mouseEvent &&
            this.elementRef
        ) {
            const scrolledX: number = this.determineParentScrollX();
            const bounding: HoverRowActionsRect = this.elementRef.nativeElement.getBoundingClientRect();
            const leftDistance = this.mouseEvent.clientX - (bounding.left + scrolledX);
            const rightDistance = (bounding.left + scrolledX) + bounding.width - this.mouseEvent.clientX;
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
        this.realPosition = position;
    }
}
