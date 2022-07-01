import { Component, Host, Inject, OnDestroy, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { ControlContainer, FormControl, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { ContactOfContactModel } from '../../../core/models/contact-of-contact.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { Subscription } from 'rxjs';
import { Constants } from '../../../core/models/constants';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import * as _ from 'lodash';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../core/services/resolvers/data/models/resolver-response.model';
import { ActivatedRoute } from '@angular/router';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { TranslateService } from '@ngx-translate/core';

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
  genderOptions: ILabelValuePairModel[];
  riskOptions: ILabelValuePairModel[];
  occupationsOptions: ILabelValuePairModel[];

  currentDate = Constants.getCurrentDate();

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  outbreakSubscriber: Subscription;

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

  visualIDTooltip: string;
  visualIdSuffixIconButtons: IAppFormIconButtonV2[] = [{
    icon: 'refresh',
    tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
    clickAction: (input) => {
      // nothing to do ?
      if (!this.selectedOutbreak?.contactIdMask) {
        return;
      }

      // generate
      this.contactOfContact.visualId = ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask);
      this.groupForm.controls.visualId.markAsDirty();
      this.onChange();

      // mark as dirty
      input.control?.markAsDirty();
    }
  }];

  /**
     * Constructor
     */
  constructor(
  @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
    @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
    private outbreakDataService: OutbreakDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService
  ) {
    super(controlContainer, validators, asyncValidators);
  }

  /**
     * Initialize component elements
     */
  ngOnInit() {
    // init value
    this.value = new ContactOfContactModel(this.value);
    this.ageChecked = !this.value.dob;
    this.ageTypeYears = this.value.age?.months < 1;

    // reference data
    this.genderOptions = (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.riskOptions = (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.occupationsOptions = (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // set visual ID translate data
        this.visualIDTooltip = this.translateService.instant(
          'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION', {
            mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
          }
        );
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
