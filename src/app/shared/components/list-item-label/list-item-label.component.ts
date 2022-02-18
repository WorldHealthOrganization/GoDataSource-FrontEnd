import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-list-item-label',
  templateUrl: './list-item-label.component.html'
})
export class ListItemLabelComponent {
  @Input() options: any[] = [];
  @Input() optionLabelKey: string = 'label';
  @Input() optionValueKey: string = 'value';
  @Input() value: any;
}
