import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, ViewEncapsulation } from '@angular/core';
import { ChronologyItem } from './typings/chronology-item';
import { Constants } from '../../../core/models/constants';
import { determineRenderMode, RenderMode } from '../../../core/enums/render-mode.enum';
import { LocalizationHelper } from '../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-chronology',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './chronology.component.html',
  styleUrls: ['./chronology.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChronologyComponent {
  // constants
  Constants = Constants;
  RenderMode = RenderMode;

  // entries
  private _entries: ChronologyItem[];
  @Input() set entries(entries: ChronologyItem[]) {
    // set collection
    this._entries = entries;

    // process data only if we have entries
    if (this._entries) {
      // sort collection descending
      this._entries.sort((e1, e2) => {
        if (e1 === e2) {
          return 0;
        } else if (
          !e1 &&
          e2
        ) {
          return -1;
        } else if (
          e1 &&
          !e2
        ) {
          return 1;
        } else {
          return e2.date.valueOf() - e1.date.valueOf();
        }
      });

      // determine number of days between events
      let previousItem: ChronologyItem;
      this._entries.forEach((item: ChronologyItem, index: number) => {
        // we don't need to determine number of days for the first item
        if (index > 0) {
          item.daysSincePreviousEvent = LocalizationHelper.toMoment(previousItem.date).startOf('day').diff(LocalizationHelper.toMoment(item.date).startOf('day'), 'days');
        }

        // previous item
        previousItem = item;
      });
    }
  }
  get entries(): ChronologyItem[] {
    return this._entries;
  }

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // update render mode
    this.updateRenderMode(true);
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(dontUpdate?: boolean): void {
    // determine render mode
    const renderMode = determineRenderMode();

    // same as before ?
    if (renderMode === this.renderMode) {
      return;
    }

    // must update
    this.renderMode = renderMode;

    // update ui
    if (!dontUpdate) {
      this.changeDetectorRef.detectChanges();
    }
  }
}
