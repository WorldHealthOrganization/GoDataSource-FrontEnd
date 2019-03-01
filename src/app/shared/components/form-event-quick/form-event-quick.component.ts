import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../core/models/constants';
import { EventModel } from '../../../core/models/event.model';

@Component({
    selector: 'app-form-event-quick',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-event-quick.component.html',
    styleUrls: ['./form-event-quick.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormEventQuickComponent,
        multi: true
    }]
})
export class FormEventQuickComponent extends GroupBase<EventModel> implements OnInit, GroupDirtyFields {

    currentDate = Constants.getCurrentDate();

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private outbreakDataService: OutbreakDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        this.value = new EventModel(this.value);

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
            });
    }

    /**
     * Event Model
     */
    get event(): EventModel {
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
