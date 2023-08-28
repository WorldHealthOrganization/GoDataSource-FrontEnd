import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';

@Component({
  selector: 'app-person-summary',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './person-summary.component.html',
  styleUrls: ['./person-summary.component.scss']
})
export class PersonSummaryComponent implements OnInit {
  @Input() person: CaseModel | ContactModel | EventModel | ContactOfContactModel;

  // constants
  ContactModel = ContactModel;
  ContactOfContactModel = ContactOfContactModel;

  @Output() remove = new EventEmitter<void>();
  @Output() modifyPerson = new EventEmitter<(CaseModel | ContactModel | EventModel | ContactOfContactModel)>();
  @Output() deletePerson = new EventEmitter<(CaseModel | ContactModel | EventModel | ContactOfContactModel)>();
  @Output() createContact = new EventEmitter<(CaseModel | ContactModel | EventModel | ContactOfContactModel)>();
  @Output() createContactOfContact = new EventEmitter<(CaseModel | ContactModel | EventModel | ContactOfContactModel)>();

  // authenticated user
  authUser: UserModel;

  personData: ILabelValuePairModel[] = [];
  personLink: string;
  personChainLink: string;

  // provide constants to template
  EntityType = EntityType;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {}

  ngOnInit() {
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.personData = this.personAndRelatedHelperService.relationship.lightEntity(this.person);

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


