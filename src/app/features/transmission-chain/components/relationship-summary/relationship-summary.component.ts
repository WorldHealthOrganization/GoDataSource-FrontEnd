import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import * as _ from 'lodash';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';

@Component({
    selector: 'app-relationship-summary',
    templateUrl: './relationship-summary.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./relationship-summary.component.less']
})
export class RelationshipSummaryComponent implements OnInit, OnChanges {
    @Input() relationship: RelationshipModel;
    @Output() remove = new EventEmitter<void>();
    @Output() modifyRelationship = new EventEmitter<RelationshipModel>();
    @Output() deleteRelationship = new EventEmitter<RelationshipModel>();
    @Output() reverseRelationshipPersons = new EventEmitter<RelationshipModel>();

    // Entities Map for specific data
    entityMap: {
        [entityType: string]: {
            can: {
                [type: string]: {
                    view: (UserModel) => boolean,
                    modify: (UserModel) => boolean,
                    delete: (UserModel) => boolean,
                    reverse: (UserModel) => boolean
                }
            }
        }
    } = {
        [EntityType.CASE]: {
            can: {
                contacts: {
                    view: CaseModel.canViewRelationshipContacts,
                    modify: CaseModel.canModifyRelationshipContacts,
                    delete: CaseModel.canDeleteRelationshipContacts,
                    reverse: CaseModel.canReverseRelationship
                }
            }
        },
        [EntityType.CONTACT]: {
            can: {
                contacts: {
                    view: ContactModel.canViewRelationshipContacts,
                    modify: ContactModel.canModifyRelationshipContacts,
                    delete: ContactModel.canDeleteRelationshipContacts,
                    reverse: ContactModel.canReverseRelationship
                }
            }
        },
        [EntityType.EVENT]: {
            can: {
                contacts: {
                    view: EventModel.canViewRelationshipContacts,
                    modify: EventModel.canModifyRelationshipContacts,
                    delete: EventModel.canDeleteRelationshipContacts,
                    reverse: EventModel.canReverseRelationship
                }
            }
        }
    };

    // authenticated user
    authUser: UserModel;
    RelationshipModel = RelationshipModel;

    selectedOutbreak: OutbreakModel;
    relationshipData: LabelValuePair[] = [];

    relationshipLink: string;

    canReverseRelation: boolean = true;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.relationship) {
            // reset reversing action if the relationship was changed
            this.canReverseRelation = true;
            const relationship: SimpleChange = changes.relationship;
            this.updateRelationshipData(relationship.currentValue);

            // condition the reversing persons action if any of them is contact or contact of contact type
            this.canReverseRelation = this.canReverseRelationships(this.relationship.persons);
        }
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
        });

        this.relationshipLink = this.getRelationshipLink();

        this.updateRelationshipData(this.relationship);
    }

    /**
     * Check if relationship can be reversed
     * @param {RelationshipModel[]} persons
     */
    canReverseRelationships(persons: RelationshipPersonModel[]) {
        // get the relationship target person
        const targetPerson = persons.find(person => person.target === true);
        // if target person is either Contact or Contact of Contact relationship can't
        // be reversed since this entities can't be sources for a relationship
        return !(targetPerson.type === EntityType.CONTACT || targetPerson.type === EntityType.CONTACT_OF_CONTACT);
    }

    private getRelationshipLink() {
        // get source person
        const sourcePerson = this.relationship.sourcePerson;

        if (sourcePerson) {
            return `/relationships/${sourcePerson.type}/${sourcePerson.id}/contacts/${this.relationship.id}/view`;
        }

        return null;
    }

    /**
     * Reverse persons of an existing relationship
     */
    reverseExistingRelationship() {
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_REVERSE_PERSONS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    const relationshipPersons = {
                        sourceId: _.find(this.relationship.persons, {target: true}).id,
                        targetId: this.relationship.sourcePerson.id
                    };
                    this.relationshipDataService
                        .reverseExistingRelationship(
                            this.selectedOutbreak.id,
                            this.relationship.id,
                            relationshipPersons.sourceId,
                            relationshipPersons.targetId
                        )
                        .subscribe(() => this.onReverseRelationshipPersons());
                }
            });
    }

    updateRelationshipData(relationship: RelationshipModel) {
        this.relationshipData = this.relationshipDataService.getLightObjectDisplay(relationship);
    }

    onRemove() {
        this.remove.emit();
    }

    onModifyRelationship() {
        this.modifyRelationship.emit(this.relationship);
    }

    onDeleteRelationship() {
        this.deleteRelationship.emit(this.relationship);
    }

    onReverseRelationshipPersons() {
        this.reverseRelationshipPersons.emit();
    }

    /**
     * Check if we're allowed to view event / case / contact / contact of contact relationships
     */
    get entityCanView(): boolean {
        return this.relationship &&
            this.relationship.sourcePerson &&
            this.relationship.sourcePerson.type &&
            this.entityMap[this.relationship.sourcePerson.type] &&
            this.entityMap[this.relationship.sourcePerson.type].can['contacts'].view(this.authUser);
    }

    /**
     * Check if we're allowed to modify event / case / contact relationships
     */
    get entityCanModify(): boolean {
        return this.relationship &&
            this.relationship.sourcePerson &&
            this.relationship.sourcePerson.type &&
            this.entityMap[this.relationship.sourcePerson.type] &&
            this.entityMap[this.relationship.sourcePerson.type].can['contacts'].modify(this.authUser);
    }

    /**
     * Check if we're allowed to delete relationships
     */
    get entityCanDelete(): boolean {
        return this.relationship &&
            this.relationship.sourcePerson &&
            this.relationship.sourcePerson.type &&
            this.entityMap[this.relationship.sourcePerson.type] &&
            this.entityMap[this.relationship.sourcePerson.type].can['contacts'].delete(this.authUser);
    }

    /**
     * Check if we're allowed to reverse relationships
     */
    get entityCanReverse(): boolean {
        return this.relationship &&
            this.relationship.sourcePerson.type !== EntityType.CONTACT &&
            this.relationship.sourcePerson.type !== EntityType.CONTACT_OF_CONTACT &&
            this.relationship.sourcePerson &&
            this.relationship.sourcePerson.type &&
            this.entityMap[this.relationship.sourcePerson.type] &&
            this.entityMap[this.relationship.sourcePerson.type].can['contacts'].reverse(this.authUser);
    }
}
