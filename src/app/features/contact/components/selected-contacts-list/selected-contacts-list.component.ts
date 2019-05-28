import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
    selector: 'app-selected-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './selected-contacts-list.component.html',
    styleUrls: ['./selected-contacts-list.component.less']
})
export class SelectedContactsListComponent {
    @Input() contacts: ContactModel[] = [];
    @Input() followUpDates: string[] = [];
}
