import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-list-item-label',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './list-item-label.component.html',
    styleUrls: ['./list-item-label.component.less']
})
export class ListItemLabelComponent {
    @Input() options: any[] = [];
    @Input() optionLabelKey: string = 'label';
    @Input() optionValueKey: string = 'value';
    @Input() value: any;
}
