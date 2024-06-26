import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter,
  forwardRef,
  Host, Input,
  OnDestroy, OnInit,
  Optional, Output,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_SELECT_CONFIG, MatSelect } from '@angular/material/select';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { AppFormLocationBaseV2, ILocation } from '../../core/app-form-location-base-v2';
import { I18nService } from '../../../../core/services/helper/i18n.service';

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

  // input
  private _input: MatSelect;
  private _openAfterInit: boolean = false;
  @ViewChild(MatSelect) set input(input: MatSelect) {
    // set
    this._input = input;

    // do we need to open after init ?
    if (this._openAfterInit) {
      this.open();
    }
  }
  get input(): MatSelect {
    return this._input;
  }

  // timers
  private _openTimer: number;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected locationDataService: LocationDataService,
    protected outbreakDataService: OutbreakDataService,
    protected toastV2Service: ToastV2Service
  ) {
    super(
      false,
      controlContainer,
      i18nService,
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

    // timers
    this.stopOpenTimer();
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
        const index: number = this.locations ?
          this.locations.findIndex((option) => option.id === this.value) :
          -1;
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
      // emit event
      this.selectedLocationChanged.emit(this.selectedLocation);

      // since we might want to select a child, but we don't know its name we need to select parent first
      // displaying the list again is a bit ugly, so after selecting the country they need to press the down key which will display the list again with its children this time
      // tooltip included
      this.addLocationConditionAndRefresh();
    }
  }

  /**
   * Timer - open
   */
  private stopOpenTimer(): void {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = undefined;
    }
  }

  /**
   * Open select
   */
  open(): void {
    // timer - open
    this.stopOpenTimer();

    // wait for binds to take effect
    this._openTimer = setTimeout(() => {
      // reset
      this._openTimer = undefined;

      // open
      if (this.input) {
        this._openAfterInit = false;
        this.input.open();
      } else {
        this._openAfterInit = true;
      }
    });
  }
}
