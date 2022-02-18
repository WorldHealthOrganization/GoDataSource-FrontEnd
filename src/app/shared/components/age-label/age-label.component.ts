import { Component, Input } from '@angular/core';
import { AgeModel } from '../../../core/models/age.model';

@Component({
  selector: 'app-age-label',
  templateUrl: './age-label.component.html'
})
export class AgeLabelComponent {
  @Input() age: AgeModel;
}
