import * as _ from 'lodash';
import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, AfterViewInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { Observable } from 'rxjs';
import { ClusterDataService } from '../../../core/services/data/cluster.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { Constants } from '../../../core/models/constants';
import { share } from 'rxjs/operators';
import { moment } from '../../../core/helperClasses/x-moment';
import { RelationshipModel } from '../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-form-relationship-quick',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-relationship-quick.component.html',
    styleUrls: ['./form-relationship-quick.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormRelationshipQuickComponent,
        multi: true
    }]
})
export class FormRelationshipQuickComponent extends GroupBase<RelationshipModel> implements OnInit, AfterViewInit, GroupDirtyFields {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    certaintyLevelOptions$: Observable<any[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureDurationOptions$: Observable<any[]>;
    socialRelationshipOptions$: Observable<any[]>;
    clusterOptions$: Observable<any[]>;

    currentDate = Constants.getCurrentDate();

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    minimumDate: string;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private clusterDataService: ClusterDataService,
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
        this.value = new RelationshipModel(this.value);

        // reference data
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL).pipe(share());
        this.exposureTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE);
        this.exposureFrequencyOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY);
        this.exposureDurationOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION);
        this.socialRelationshipOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION);

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                if (this.selectedOutbreak) {
                    this.getMinimumDate();
                    this.clusterOptions$ = this.clusterDataService.getClusterList(this.selectedOutbreak.id);
                }
            });
    }

    ngAfterViewInit() {
        // call parent
        super.ngAfterViewInit();

        setTimeout(() => {
            // set default values on relationship
            this.certaintyLevelOptions$
                .subscribe((options: LabelValuePair[]) => {
                    if (!_.isEmpty(options) && _.isEmpty(this.value.certaintyLevelId)) {
                        // get the last option selected by default (high)
                        this.value.certaintyLevelId = Constants.CERTAINITY_LEVEL.HIGH;
                    }
                });
        });
    }

    /**
     * Relationship Model
     */
    get relationship(): RelationshipModel {
        return this.value;
    }

    /**
     * Get minimum date for date of last contact
     */
    getMinimumDate() {
        if (this.selectedOutbreak.startDate) {
            this.minimumDate = moment(this.selectedOutbreak.startDate).subtract(6, 'months').format();
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
