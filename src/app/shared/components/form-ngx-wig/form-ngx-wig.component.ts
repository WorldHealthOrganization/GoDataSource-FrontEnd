import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnDestroy, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../xt-forms/core';
import { BUTTONS, NgxWigComponent } from 'ngx-wig';
import { NgxWigCustomLibraryButtons } from './definitions/ngx-wig-custom-library-buttons';

@Component({
    selector: 'app-form-ngx-wig',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-ngx-wig.component.html',
    styleUrls: ['./form-ngx-wig.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormNgxWigComponent,
        multi: true
    }, {
        provide: BUTTONS,
        multi: true,
        useClass: NgxWigCustomLibraryButtons
    }]
})
export class FormNgxWigComponent extends ElementBase<string> implements  OnDestroy{
    private _disabled: boolean = false;
    @Input() set disabled(disabled: boolean) {
        // set value
        this._disabled = disabled;

        // register disabled component
        this.registerDisabledComponent();
    }
    get disabled(): boolean {
        return this._disabled;
    }

    private _name: string;
    @Input() set name(name: string) {
        // set name
        this._name = name;

        // register component for easy find
        this.registerComponent();

        // register disabled component
        this.registerDisabledComponent();
    }
    get name(): string {
        return this._name;
    }

    private _ngxWig: NgxWigComponent;
    @ViewChild('ngxWig') set ngxWig(ngxWig: NgxWigComponent) {
        // keep reference
        this._ngxWig = ngxWig;

        // register component for easy find
        this.registerComponent();
    }
    get ngxWig(): NgxWigComponent {
        return this._ngxWig;
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Release data
     */
    ngOnDestroy(): void {
        // release listeners
        // #TODO - must be component limited, otherwise destroying one component listeners will destroy the other listeners as well which isn't okay
        NgxWigCustomLibraryButtons.releaseHtmlListeners();

        // component behaviour
        if (this.name) {
            // release components
            NgxWigCustomLibraryButtons.releaseComponentsMap(this.name);

            // remove from disabled components
            NgxWigCustomLibraryButtons.unregisterDisabledComponent(
                this.name
            );
        }
    }

    /**
     * Register component for easy access
     */
    private registerComponent() {
        if (this.name) {
            // register component for easy find
            NgxWigCustomLibraryButtons.registerComponent(
                this.name,
                this.ngxWig
            );
        }
    }

    /**
     * Register disabled component
     */
    private registerDisabledComponent() {
        if (this.name) {
            // add / remove from disabled components
            if (this.disabled) {
                // remove from disabled components
                NgxWigCustomLibraryButtons.registerDisabledComponent(
                    this.name
                );
            } else {
                // remove from disabled components
                NgxWigCustomLibraryButtons.unregisterDisabledComponent(
                    this.name
                );
            }
        }
    }
}
