import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { IBasicCount } from '../../../core/models/basic-count.interface';

@Component({
  selector: 'app-total-number-of-records',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './total-number-of-records.component.html',
  styleUrls: ['./total-number-of-records.component.less']
})
export class TotalNumberOfRecordsComponent {
  // display count
  @Input() value: IBasicCount;

  // must trigger refresh
  @Output() showAll = new EventEmitter<void>();

  /**
     * Display exact count
     */
  showExactCount(): void {
    this.showAll.emit();
  }
}
