import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../core/models/constants';
import { ContactModel } from '../../../core/models/contact.model';

@Component({
    selector: 'app-form-contact-quick',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-contact-quick.component.html',
    styleUrls: ['./form-contact-quick.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormContactQuickComponent,
        multi: true
    }]
})
export class FormContactQuickComponent extends GroupBase<ContactModel> implements OnInit, GroupDirtyFields {
    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    finalFollowUpStatus$: Observable<any[]>;

    currentDate = Constants.getCurrentDate();

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    visualIDTranslateData: {
        mask: string
    };

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        this.value = new ContactModel(this.value);

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // set visual ID translate data
                this.visualIDTranslateData = {
                    mask: ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
                };
            });
    }

    /**
     * Contact Model
     */
    get contact(): ContactModel {
        return this.value;
    }

    /**
     * Retrieve fields
     */
    getDirtyFields(): {
        [name: string]: FormControl
    } {
        const dirtyControls = {};
        _.forEach(this.groupForm.controls, (control: FormControl, controlName: string) => {
            if (control.dirty) {
                dirtyControls[controlName] = control;
            }
        });
        return dirtyControls;
    }
}
