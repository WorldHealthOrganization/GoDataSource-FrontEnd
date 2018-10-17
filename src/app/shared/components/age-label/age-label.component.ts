import { Component, Input, ViewEncapsulation } from '@angular/core';
import { AgeModel } from '../../../core/models/age.model';

@Component({
    selector: 'app-age-label',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './age-label.component.html',
    styleUrls: ['./age-label.component.less']
})
export class AgeLabelComponent {
    @Input() age: AgeModel;
}
