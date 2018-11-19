import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-relationship-type-label',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './relationship-type-label.component.html',
    styleUrls: ['./relationship-type-label.component.less']
})
export class RelationshipTypeLabelComponent {
    @Input() isSource: boolean = false;
}
