import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import { Constants } from '../../../core/models/constants';
import { CaseModel } from '../../../core/models/case.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { IResolverV2ResponseModel } from '../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';

@Component({
  selector: 'app-form-case-quick',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './form-case-quick.component.html',
  styleUrls: ['./form-case-quick.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FormCaseQuickComponent,
    multi: true
  }]
})
export class FormCaseQuickComponent extends GroupBase<CaseModel> implements OnInit, GroupDirtyFields, OnDestroy {
  genderOptions: ILabelValuePairModel[];
  occupationOptions: ILabelValuePairModel[];
  caseRiskLevelsOptions: ILabelValuePairModel[];
  caseClassificationsOptions: ILabelValuePairModel[];
  outcomeOptions: ILabelValuePairModel[];

  currentDate = Constants.getCurrentDate();

  outbreakSubscriber: Subscription;

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  visualIDTooltip: string;

  ageChecked: boolean;
  ageTypeYears: boolean;

  Constants = Constants;
  FormHelperService = FormHelperService;

  ageDOBOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_ENTITY_FIELD_LABEL_AGE',
      value: true
    }, {
      label: 'LNG_ENTITY_FIELD_LABEL_DOB',
      value: false
    }
  ];
  ageTypeOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_AGE_FIELD_LABEL_YEARS',
      value: true
    }, {
      label: 'LNG_AGE_FIELD_LABEL_MONTHS',
      value: false
    }
  ];

  visualIdSuffixIconButtons: IAppFormIconButtonV2[] = [{
    icon: 'refresh',
    tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
    clickAction: (input) => {
      // nothing to do ?
      if (!this.selectedOutbreak?.caseIdMask) {
        return;
      }

      // generate
      this.case.visualId = CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask);
      this.groupForm.controls.visualId.markAsDirty();
      this.onChange();

      // mark as dirty
      input.control?.markAsDirty();
    }
  }];

  constructor(
  @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
    @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private outbreakDataService: OutbreakDataService
  ) {
    super(controlContainer, validators, asyncValidators);
  }

  /**
     * Initialize component elements
     */
  ngOnInit() {
    // init value
    this.value = new CaseModel(this.value);
    this.ageChecked = !this.value.dob;
    this.ageTypeYears = this.value.age?.months < 1;

    // reference data
    this.genderOptions = (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.occupationOptions = (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.caseRiskLevelsOptions = (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.caseClassificationsOptions = (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.outcomeOptions = (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // set visual ID translate data
        this.visualIDTooltip = this.translateService.instant(
          'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION', {
            mask: CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
          }
        );
      });
  }

  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
     * Case Model
     */
  get case(): CaseModel {
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
