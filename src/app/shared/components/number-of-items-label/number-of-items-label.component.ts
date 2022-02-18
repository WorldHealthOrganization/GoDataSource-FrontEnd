import { Component, Input } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-number-of-items-label',
  templateUrl: './number-of-items-label.component.html'
})
export class NumberOfItemsLabelComponent {

  @Input() value: number;

  get translationData() {
    let numericValue = Number(this.value || 0);
    numericValue = !_.isNaN(numericValue) ? numericValue : 0;

    return {
      value: numericValue
    };
  }
}
