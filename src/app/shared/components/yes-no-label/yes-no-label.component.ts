import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-yes-no-label',
  templateUrl: './yes-no-label.component.html'
})
export class YesNoLabelComponent {
  @Input() value: boolean;
}
