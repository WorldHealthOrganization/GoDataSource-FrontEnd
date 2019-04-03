import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ListBase } from '../../xt-forms/core';
import { Subscriber ,  Observable } from 'rxjs';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-input-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-input-list.component.html',
    styleUrls: ['./form-input-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormInputListComponent,
        multi: true
    }]
})
export class FormInputListComponent extends ListBase<string | number> implements OnInit {
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() placeholder: string = '';
    @Input() tooltip: string;
    @Input() type: string = 'text';
    @Input() unique: boolean = false;

    private _values: any[] = [];

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Create new item
     */
    protected generateNewItem(): string | number {
        return '';
    }

    /**
     * Retrieve items list
     */
    get inputValues() {
        // refresh custom list items
        const valuesData = (this.value ? this.value : []) as any[];
        valuesData.forEach((value, index) => {
            if (!this._values[index]) { this._values.push({}); }
            this._values[index].value = value;
        });

        // retrieve custom items list
        return this._values;
    }

    /**
     * Custom bind
     * @param index
     */
    onChangeItem(index: number) {
        this.values[index] = this._values[index].value;
        super.onChange();
    }

    /**
     * Delete item record
     * @param index
     * @param overrideConfirm
     */
    delete(index, overrideConfirm: boolean = false) {
        // delete method
        const deleteItem = () => {
            // delete from main list
            super.delete(index, true);

            // refresh custom list items
            this._values = [];
            const valuesData = (this.value ? this.value : []) as any[];
            valuesData.forEach((value, index2) => {
                if (!this._values[index2]) { this._values.push({}); }
                this._values[index2].value = value;
            });
        };

        // are we allowed to remove this item ?
        // if not there is no point in continuing
        if ((this.values as any[]).length <= this.minItems) {
            return;
        }

        // show confirm dialog to confirm the action
        if (!_.values(this._values[index]).some(x => x !== undefined && x !== '') || overrideConfirm ) {
            deleteItem();
        } else {
            new Observable((observer) => {
                this.deleteConfirm.emit(observer);
            }).subscribe(() => {
                deleteItem();
            });
        }
    }

    ngOnInit() {
        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_INPUT')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }
}
