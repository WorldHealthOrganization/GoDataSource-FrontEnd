import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, UntypedFormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import { Constants } from '../../../core/models/constants';
import { ContactModel } from '../../../core/models/contact.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../core/services/resolvers/data/models/resolver-response.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { ReferenceDataHelperService } from '../../../core/services/helper/reference-data-helper.service';
import { PersonAndRelatedHelperService } from '../../../core/services/helper/person-and-related-helper.service';

@Component({
  selector: 'app-form-contact-quick',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './form-contact-quick.component.html',
  styleUrls: ['./form-contact-quick.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FormContactQuickComponent,
    multi: true
  }]
})
export class FormContactQuickComponent extends GroupBase<ContactModel> implements OnInit, GroupDirtyFields, OnDestroy {
  genderOptions: ILabelValuePairModel[];
  riskOptions: ILabelValuePairModel[];
  occupationsOptions: ILabelValuePairModel[];
  finalFollowUpStatusOptions: ILabelValuePairModel[];

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
      this.contact.visualId = this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask);
      this.groupForm.controls.visualId.markAsDirty();
      this.onChange();

      // mark as dirty
      input.control?.markAsDirty();
    }
  }];

  constructor(@Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
    @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private outbreakDataService: OutbreakDataService,
    private referenceDataHelperService: ReferenceDataHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    super(controlContainer, validators, asyncValidators);
  }

  /**
     * Initialize component elements
     */
  ngOnInit() {
    // init value
    this.value = new ContactModel(this.value);
    this.ageChecked = !this.value.dob;
    this.ageTypeYears = this.value.age?.months < 1;

    // reference data
    this.genderOptions = (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;
    this.finalFollowUpStatusOptions = (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options;

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        if (!this.selectedOutbreak?.id) {
          return;
        }

        // refresh ref data options
        this.refreshReferenceData();

        // set visual ID translate data
        this.visualIDTooltip = this.i18nService.instant(
          'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION', {
            mask: this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask)
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
   * Write value
   */
  writeValue(value: ContactModel) {
    super.writeValue(value);

    // refresh ref data options
    this.refreshReferenceData();
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

  /**
   * Refresh ref data options
   */
  private refreshReferenceData(): void {
    // reference data
    this.riskOptions = this.referenceDataHelperService.filterPerOutbreakOptions(
      this.selectedOutbreak,
      (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
      this.contact?.riskLevel
    );
    this.occupationsOptions = this.referenceDataHelperService.filterPerOutbreakOptions(
      this.selectedOutbreak,
      (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
      this.contact?.occupation
    );
  }
}
