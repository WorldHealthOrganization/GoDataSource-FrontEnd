import { Component, Input } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
  selector: 'app-selected-contacts-list',
  templateUrl: './selected-contacts-list.component.html'
})
export class SelectedContactsListComponent {
  @Input() persons: (ContactModel | CaseModel)[] = [];

  // Constants for template
  EntityType = EntityType;
}
