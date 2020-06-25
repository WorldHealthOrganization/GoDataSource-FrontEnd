import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
    selector: 'app-person-summary',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './person-summary.component.html',
    styleUrls: ['./person-summary.component.less']
})
export class PersonSummaryComponent implements OnInit {
    @Input() person: CaseModel | ContactModel | EventModel;

    // constants
    ContactModel = ContactModel;
    ContactOfContactModel = ContactOfContactModel;

    @Output() remove = new EventEmitter<void>();
    @Output() modifyPerson = new EventEmitter<(CaseModel | ContactModel | EventModel)>();
    @Output() deletePerson = new EventEmitter<(CaseModel | ContactModel | EventModel)>();
    @Output() createContact = new EventEmitter<(CaseModel | ContactModel | EventModel)>();
    @Output() createContactOfContact = new EventEmitter<(CaseModel | ContactModel | EventModel)>();

    // authenticated user
    authUser: UserModel;

    personData: LabelValuePair[] = [];
    personLink: string;
    personChainLink: string;

    // provide constants to template
    EntityType = EntityType;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService
    ) {}

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.personData = this.entityDataService.getLightObjectDisplay(this.person);
        this.personLink = this.getPersonLink();
        this.personChainLink = this.getPersonChainLink();
    }

    private getPersonLink() {
        const entityTypeLink = EntityModel.getLinkForEntityType(this.person.type);
        return `/${entityTypeLink}/${this.person.id}/view`;
    }

    private getPersonChainLink() {
        return `/transmission-chains?personId=${this.person.id}&selectedEntityType=${this.person.type}`;
    }

    onRemove() {
        this.remove.emit();
    }

    onModifyPerson() {
        this.modifyPerson.emit(this.person);
    }

    onCreateContact() {
        this.createContact.emit(this.person);
    }

    onCreateContactOfContact() {
        this.createContactOfContact.emit(this.person);
    }

    onDeletePerson() {
        this.deletePerson.emit(this.person);
    }
}


