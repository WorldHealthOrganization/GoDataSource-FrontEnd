import * as _ from 'lodash';
import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { RelationshipModel } from '../../../core/models/relationship.model';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { Observable } from 'rxjs/Observable';
import { ClusterDataService } from '../../../core/services/data/cluster.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { EntityType } from '../../../core/models/entity-type';
import { Moment } from 'moment';

@Component({
    selector: 'app-form-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-relationship.component.html',
    styleUrls: ['./form-relationship.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormRelationshipComponent,
        multi: true
    }]
})
export class FormRelationshipComponent extends GroupBase<RelationshipModel> implements OnInit, AfterViewInit, GroupDirtyFields {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() relatedObject: any;

    @Input() displayCopyField: boolean = false;
    @Input() displayCopyFieldDescription: string;
    @Output() copyValue = new EventEmitter<string>();

    certaintyLevelOptions$: Observable<any[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureDurationOptions$: Observable<any[]>;
    socialRelationshipOptions$: Observable<any[]>;
    clusterOptions$: Observable<any[]>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // provide constants to template
    EntityType = EntityType;

    serverToday: Moment = null;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private genericDataService: GenericDataService,
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

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        // reference data
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL).share();
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
                    if (!_.isEmpty(options)) {
                        // get the first option selected by default
                        this.value.certaintyLevelId = options[0].value;
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
     * Copy value
     * @param property
     */
    triggerCopyValue(property) {
        this.copyValue.emit(property);
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
