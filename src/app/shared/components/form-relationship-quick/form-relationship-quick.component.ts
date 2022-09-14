import * as _ from 'lodash';
import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, UntypedFormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { ClusterDataService } from '../../../core/services/data/cluster.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import { Constants } from '../../../core/models/constants';
import { moment } from '../../../core/helperClasses/x-moment';
import { RelationshipModel } from '../../../core/models/entity-and-relationship.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { ActivatedRoute } from '@angular/router';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../core/services/resolvers/data/models/resolver-response.model';

@Component({
  selector: 'app-form-relationship-quick',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './form-relationship-quick.component.html',
  styleUrls: ['./form-relationship-quick.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FormRelationshipQuickComponent,
    multi: true
  }]
})
export class FormRelationshipQuickComponent extends GroupBase<RelationshipModel> implements OnInit, AfterViewInit, GroupDirtyFields, OnDestroy {
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;

  certaintyLevelOptions: ILabelValuePairModel[];
  exposureTypeOptions: ILabelValuePairModel[];
  exposureFrequencyOptions: ILabelValuePairModel[];
  exposureDurationOptions: ILabelValuePairModel[];
  socialRelationshipOptions: ILabelValuePairModel[];
  clusterOptions: ILabelValuePairModel[];

  currentDate = Constants.getCurrentDate();

  outbreakSubscriber: Subscription;

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  minimumDate: string;

  constructor(
  @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
    @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
    private clusterDataService: ClusterDataService,
    private outbreakDataService: OutbreakDataService,
    private activatedRoute: ActivatedRoute
  ) {
    super(controlContainer, validators, asyncValidators);

    // data
    this.certaintyLevelOptions = (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.exposureTypeOptions = (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.exposureFrequencyOptions = (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.exposureDurationOptions = (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.socialRelationshipOptions = (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
  }

  /**
     * Initialize component elements
     */
  ngOnInit() {
    // init value
    this.value = new RelationshipModel(this.value);

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
        if (this.selectedOutbreak) {
          this.getMinimumDate();
          this.clusterDataService
            .getClusterList(this.selectedOutbreak.id)
            .subscribe((data) => {
              this.clusterOptions = data.map((item) => ({
                label: item.name,
                value: item.id
              }));
            });
        }
      });
  }

  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  ngAfterViewInit() {
    // call parent
    super.ngAfterViewInit();
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
    [name: string]: UntypedFormControl
  } {
    const dirtyControls = {};
    _.forEach(this.groupForm.controls, (control: UntypedFormControl, controlName: string) => {
      if (control.dirty) {
        dirtyControls[controlName] = control;
      }
    });
    return dirtyControls;
  }
}
