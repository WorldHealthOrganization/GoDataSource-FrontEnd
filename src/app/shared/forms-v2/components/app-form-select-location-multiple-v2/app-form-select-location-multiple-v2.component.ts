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
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { AppFormLocationBaseV2, ILocation } from '../../core/app-form-location-base-v2';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-form-select-location-multiple-v2',
  templateUrl: './app-form-select-location-multiple-v2.component.html',
  styleUrls: ['./app-form-select-location-multiple-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectLocationMultipleV2Component),
    multi: true
  }, {
    provide: MAT_SELECT_CONFIG,
    useValue: {
      overlayPanelClass: [
        'gd-cdk-overlay-pane-location',
        'gd-cdk-overlay-pane-location-multi'
      ]
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectLocationMultipleV2Component
  extends AppFormLocationBaseV2<string[]> implements OnInit, OnDestroy {

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // selected locations
  selectedLocations: ILocation[] = [];

  // selected locations changed
  @Output() selectedLocationsChanged = new EventEmitter<ILocation[]>();

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
      true,
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
      if (
        this.value &&
        this.value.length > 0
      ) {
        // determine value to search
        const valueToSearch: string = this.value[0];
        const index: number = this.locations.findIndex((option) => option.id === valueToSearch);
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
    // map selected item
    const selectedMap: {
      [id: string]: true
    } = {};
    (this.value || []).forEach((id) => {
      selectedMap[id] = true;
    });

    // map current list of selected items
    const newSelectedItems: ILocation[] = [];
    const newSelectedItemsMap: {
      [id: string]: true
    } = {};
    this.selectedLocations.forEach((item) => {
      // removed ?
      if (!selectedMap[item.id]) {
        return;
      }

      // add it back to list
      newSelectedItems.push(item);
      newSelectedItemsMap[item.id] = true;
    });

    // add missing items to the list
    // - those that were selected now
    Object.keys(selectedMap).forEach((id) => {
      // already added ?
      if (newSelectedItemsMap[id]) {
        return;
      }

      // add it
      newSelectedItems.push(this.locationMap[id]);
    });

    // update selected list
    this.selectedLocations = newSelectedItems;

    // emit event
    if (emitEvent) {
      this.selectedLocationsChanged.emit(this.selectedLocations);
    }
  }
}
