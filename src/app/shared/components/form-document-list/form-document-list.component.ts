import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ListBase } from '../../xt-forms/core';
import { DocumentModel } from '../../../core/models/document.model';


@Component({
    selector: 'app-form-document-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-document-list.component.html',
    styleUrls: ['./form-document-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDocumentListComponent,
        multi: true
    }]
})
export class FormDocumentListComponent extends ListBase<DocumentModel> implements OnInit {
    @Input() viewOnly: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        this.removeConfirmMsg = 'Are you sure you want to delete this document?';
    }
}
