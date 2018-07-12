import * as _ from 'lodash';
import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core';
import { RelationshipModel } from '../../../core/models/relationship.model';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { Observable } from 'rxjs/Observable';
import { ClusterDataService } from '../../../core/services/data/cluster.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';

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
export class FormRelationshipComponent extends GroupBase<RelationshipModel> implements OnInit {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() relatedTitle: string;
    @Input() relatedObject: any;

    certaintyLevelOptions$: Observable<any[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureDurationOptions$: Observable<any[]>;
    socialRelationshipOptions$: Observable<any[]>;
    clusterOptions$: Observable<any[]>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private genericDataService: GenericDataService,
        private clusterDataService: ClusterDataService,
        private outbreakDataService: OutbreakDataService
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
        this.certaintyLevelOptions$ = this.genericDataService.getCertaintyLevelOptions();
        this.exposureTypeOptions$ = this.genericDataService.getExposureTypeOptions();
        this.exposureFrequencyOptions$ = this.genericDataService.getExposureFrequencyOptions();
        this.exposureDurationOptions$ = this.genericDataService.getExposureDurationOptions();
        this.socialRelationshipOptions$ = this.genericDataService.getSocialRelationshipOptions();

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

    /**
     * Relationship Model
     */
    get relationship(): RelationshipModel {
        return this.value;
    }
}