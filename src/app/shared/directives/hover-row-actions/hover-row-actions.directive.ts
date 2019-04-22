import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { HoverRowAction, HoverRowActionsComponent } from '../../components';
import * as _ from 'lodash';

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
    @Input() hoverRowActions: HoverRowAction[] = [];

    /**
     * Actions Data
     */
    @Input() hoverRowActionData: any;

    /**
     * Previous event
     */
    private _previousEvent: MouseEvent;

    /**
     * Constructor
     */
    constructor(
        private elementRef: ElementRef
    ) { }

    /**
     * Construct list of visible actions
     */
    private getVisibleActions(): HoverRowAction[] {
        // construct list of visible actions
        const visibleActions: HoverRowAction[] = [];
        _.each(this.hoverRowActions, (action: HoverRowAction) => {
            // action visible ?
            if (
                action.visible !== undefined &&
                !action.visible(this.hoverRowActionData)
            ) {
                return;
            }

            // clone action
            const clonedAction = new HoverRowAction(action);
            clonedAction.menuOptions = clonedAction.menuOptions ? [] : clonedAction.menuOptions;
            _.each(action.menuOptions, (menuOption: HoverRowAction) => {
                // action visible ?
                if (
                    menuOption.visible !== undefined &&
                    !menuOption.visible(this.hoverRowActionData)
                ) {
                    return;
                }

                // add menu option
                clonedAction.menuOptions.push(new HoverRowAction(menuOption));
            });

            // no neu options, then we don't need to display menu options button
            if (_.isEmpty(clonedAction.menuOptions)) {
                clonedAction.menuOptions = undefined;
            }

            // add action
            visibleActions.push(clonedAction);
        });

        // finished
        return visibleActions;
    }

    /**
     * Display actions
     * @param event
     */
    private show(event) {
        // trigger show
        if (this.hoverRowActionsComponent) {
            // keep an instance of the event
            this._previousEvent = event;

            // display actions
            this.hoverRowActionsComponent.show(
                this,
                this.elementRef,
                this.getVisibleActions(),
                this.hoverRowActionData,
                event
            );
        }
    }

    /**
     * For redraw of actions
     */
    public redraw() {
        this.show(this._previousEvent);
    }

    /**
     * Mouse enter row
     */
    @HostListener('mouseenter', ['$event'])
    mouseEnter(event) {
        this.show(event);
    }

    /**
     * Mouse move row
     */
    @HostListener('mousemove', ['$event'])
    mouseMove(event) {
        // display actions
        if (this.hoverRowActionsComponent) {
            // keep an instance of the event
            this._previousEvent = event;

            // update
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
        this.show(event);
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
