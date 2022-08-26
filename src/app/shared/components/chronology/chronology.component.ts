import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { ChronologyItem } from './typings/chronology-item';
import { Constants } from '../../../core/models/constants';
import { moment } from '../../../core/helperClasses/x-moment';

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

  // entries
  private _entries: ChronologyItem[] = [];
  @Input() set entries(entries: ChronologyItem[]) {
    // set collection
    this._entries = entries || [];

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
        item.daysSincePreviousEvent = moment(previousItem.date).startOf('day').diff(moment(item.date).startOf('day'), 'days');
      }

      // previous item
      previousItem = item;
    });
  }
  get entries(): ChronologyItem[] {
    return this._entries;
  }
}
