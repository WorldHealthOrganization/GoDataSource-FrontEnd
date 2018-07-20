import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { GroupBase } from '../../xt-forms/core';
import { DocumentModel } from '../../../core/models/document.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../core/models/constants';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';

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
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // retrieve document types
        this.documentTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DOCUMENT_TYPE);

        // init value
        this.value = new DocumentModel(this.value);
    }

    /**
     * Document Model
     */
    get document(): DocumentModel {
        return this.value;
    }
}
