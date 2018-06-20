import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { GroupBase } from '../../xt-forms/core';
import { DocumentModel } from '../../../core/models/document.model';
import { GenericDataService } from '../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-form-document',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-document.component.html',
    styleUrls: ['./form-document.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDocumentComponent,
        multi: true
    }]
})
export class FormDocumentComponent extends GroupBase<DocumentModel> implements OnInit {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    documentTypesList$: Observable<any[]>;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private genericDataService: GenericDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        this.documentTypesList$ = this.genericDataService.getDocumentTypesList();

        // init value
        if (this.value) {
            this.value = this.value instanceof DocumentModel ? this.value : new DocumentModel(this.value);
        } else {
            this.value = new DocumentModel();
        }
    }

    /**
     * Document Model
     */
    get document(): DocumentModel {
        return this.value;
    }
}
