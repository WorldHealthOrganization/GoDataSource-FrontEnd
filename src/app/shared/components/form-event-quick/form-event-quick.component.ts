import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, UntypedFormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../core/models/constants';
import { EventModel } from '../../../core/models/event.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-form-event-quick',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './form-event-quick.component.html',
  styleUrls: ['./form-event-quick.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FormEventQuickComponent,
    multi: true
  }]
})
export class FormEventQuickComponent extends GroupBase<EventModel> implements OnInit, GroupDirtyFields, OnDestroy {

  currentDate = Constants.getCurrentDate();

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  visualIDTooltip: string;

  outbreakSubscriber: Subscription;

  visualIdSuffixIconButtons: IAppFormIconButtonV2[] = [{
    icon: 'refresh',
    tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
    clickAction: (input) => {
      // nothing to do ?
      if (!this.selectedOutbreak?.eventIdMask) {
        return;
      }

      // generate
      this.event.visualId = EventModel.generateEventIDMask(this.selectedOutbreak.eventIdMask);
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
    private outbreakDataService: OutbreakDataService,
    private translateService: TranslateService
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
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
      });

    // set visual ID translate data
    this.visualIDTooltip = this.translateService.instant(
      'LNG_EVENT_FIELD_LABEL_VISUAL_ID_DESCRIPTION', {
        mask: EventModel.generateEventIDMask(this.selectedOutbreak.eventIdMask)
      }
    );
  }

  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
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
