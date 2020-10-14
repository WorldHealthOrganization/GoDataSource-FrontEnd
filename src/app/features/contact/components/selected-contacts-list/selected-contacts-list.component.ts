import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-selected-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './selected-contacts-list.component.html',
    styleUrls: ['./selected-contacts-list.component.less']
})
export class SelectedContactsListComponent {
    @Input() persons: (ContactModel | CaseModel)[] = [];

    // Constants for template
    EntityType = EntityType;
}
