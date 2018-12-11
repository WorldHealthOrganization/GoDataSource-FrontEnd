import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Host, Inject, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { FormSelectComponent } from './form-select.component';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-form-select-change-detection-push',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select.component.html',
    styleUrls: ['./form-select.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectChangeDetectionPushComponent,
        multi: true
    }],

    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormSelectChangeDetectionPushComponent extends FormSelectComponent {
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        protected i18nService: I18nService,
        protected changeDetectorRef: ChangeDetectorRef
    ) {
        super(
            controlContainer,
            validators,
            asyncValidators,
            i18nService
        );

        // listen for changes
        this.registerOnChange(() => {
            this.markForCheck();
        });
    }

    /**
     * Write Value
     * @param value
     */
    writeValue(value: any) {
        super.writeValue(value);
        this.markForCheck();
    }

    /**
     * Handle changes
     */
    markForCheck() {
        this.changeDetectorRef.markForCheck();
    }
}
