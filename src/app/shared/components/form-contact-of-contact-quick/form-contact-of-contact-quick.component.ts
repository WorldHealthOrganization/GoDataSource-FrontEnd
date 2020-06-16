import { Component, Host, Inject, OnDestroy, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { ControlContainer, FormControl, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { ContactOfContactModel } from '../../../core/models/contact-of-contact.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Observable, Subscription } from 'rxjs';
import { Constants } from '../../../core/models/constants';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-contact-of-contact-quick',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-contact-of-contact-quick.component.html',
    styleUrls: ['./form-contact-of-contact-quick.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormContactOfContactQuickComponent,
        multi: true
    }]
})
export class FormContactOfContactQuickComponent extends GroupBase<ContactOfContactModel> implements OnInit, GroupDirtyFields, OnDestroy {

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    currentDate = Constants.getCurrentDate();

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    displayRefresh: boolean = false;

    outbreakSubscriber: Subscription;

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
        this.value = new ContactOfContactModel(this.value);

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // subscribe to the Selected Outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                // if contact id mask is not empty show refresh contact id mask button
                if (!_.isEmpty(this.selectedOutbreak.contactIdMask)) {
                    this.displayRefresh = true;
                }

                // set visual ID translate data
                this.visualIDTranslateData = {
                    mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactIdMask)
                };
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy(): void {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Contact of Contact Model
     */
    get contactOfContact(): ContactOfContactModel {
        return this.value;
    }

    /**
     * Generate visual ID for contact
     */
    generateVisualId() {
        if (!_.isEmpty(this.selectedOutbreak.contactIdMask)) {
            this.contactOfContact.visualId = ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactIdMask);
            this.groupForm.controls.visualId.markAsDirty();
            this.onChange();
        }
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
