import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    HostBinding,
    Output,
    EventEmitter,
    AfterViewInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-form-input',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-input.component.html',
    styleUrls: ['./form-input.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormInputComponent,
        multi: true
    }]
})
export class FormInputComponent extends ElementBase<string> implements AfterViewInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;

    @Input() type: string = 'text';
    @Input() required: boolean = false;
    @Input() name: string;
    @Input() disabled: boolean = false;
    @Input() readonly: boolean = false;

    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken, this.tooltipTranslateData) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    private _tooltipTranslateData: any;
    @Input() set tooltipTranslateData(tooltipTranslateData: any) {
        this._tooltipTranslateData = tooltipTranslateData;
        this.tooltip = this._tooltipToken;
    }
    get tooltipTranslateData(): any {
        return this._tooltipTranslateData;
    }

    @Input() displayFilterIcon: boolean = false;

    @Input() maxlength: number;

    @Input() step: number = 1;
    @Input() min: number;
    @Input() max: number;

    @Output() optionChanged = new EventEmitter<any>();
    @Output() initialized = new EventEmitter<any>();

    public identifier = `form-input-${FormInputComponent.identifier++}`;

    tempTypeOverwritten: string;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);

        // on language change..we need to translate again the token
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.tooltip = this._tooltipToken;
        });
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange() {
        // emit the current value
        return this.optionChanged.emit(this.value);
    }

    ngAfterViewInit() {
        // wait for the input object to be initialized
        // then trigger the initialized event
        setTimeout(() => {
            this.initialized.emit(this.value);
        });

        super.ngAfterViewInit();
    }

    /**
     * toggle show / hide password
     */
    togglePasswordDisplay() {
        if (this.tempTypeOverwritten === 'password') {
            this.type = 'password';
            this.tempTypeOverwritten = '';
        } else {
            this.type = 'text';
            this.tempTypeOverwritten = 'password';
        }
    }
}
