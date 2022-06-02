import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter,
  forwardRef,
  Host, Input,
  OnDestroy, OnInit,
  Optional, Output,
  SkipSelf, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { AppFormLocationBaseV2, ILocation } from '../../core/app-form-location-base-v2';

@Component({
  selector: 'app-form-select-location-single-v2',
  templateUrl: './app-form-select-location-single-v2.component.html',
  styleUrls: ['./app-form-select-location-single-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectLocationSingleV2Component),
    multi: true
  }, {
    provide: MAT_SELECT_CONFIG,
    useValue: {
      overlayPanelClass: 'gd-cdk-overlay-pane-location'
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectLocationSingleV2Component
  extends AppFormLocationBaseV2<string> implements OnInit, OnDestroy {

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // selected location
  selectedLocation: ILocation;

  // clearable ?
  @Input() clearable: boolean = false;

  // selected location changed
  @Output() selectedLocationChanged = new EventEmitter<ILocation>();

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected locationDataService: LocationDataService,
    protected outbreakDataService: OutbreakDataService,
    protected toastV2Service: ToastV2Service
  ) {
    super(
      false,
      controlContainer,
      translateService,
      changeDetectorRef,
      locationDataService,
      outbreakDataService,
      toastV2Service
    );
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // initialize
    super.onInit();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * vScroll to see the first selected item
   */
  vScrollToFirstSelectedOption(): void {
    // scroll to item ?
    if (
      this.value &&
      this.cdkVirtualScrollViewport
    ) {
      // hack to force re-render, otherwise we see an empty scroll
      if (this.value) {
        // determine value to search
        const index: number = this.locations.findIndex((option) => option.id === this.value);
        if (index > -1) {
          this.cdkVirtualScrollViewport.scrollToIndex(index);
        }
      }
    }
  }

  /**
   * Update selected items
   */
  updateSelected(emitEvent: boolean): void {
    // update selected list
    this.selectedLocation = this.value && this.locationMap[this.value] ?
      this.locationMap[this.value] :
      undefined;

    // emit event
    if (emitEvent) {
      this.selectedLocationChanged.emit(this.selectedLocation);
    }
  }
}
