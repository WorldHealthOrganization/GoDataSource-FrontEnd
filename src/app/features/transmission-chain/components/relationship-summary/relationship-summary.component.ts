import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import {OutbreakModel} from '../../../../core/models/outbreak.model';
import {OutbreakDataService} from '../../../../core/services/data/outbreak.data.service';
import * as _ from 'lodash';
import {EntityType} from '../../../../core/models/entity-type';

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

    // authenticated user
    authUser: UserModel;
    selectedOutbreak: OutbreakModel;
    relationshipData: LabelValuePair[] = [];

    relationshipLink: string;

    canReverseRelation: boolean = true;

    constructor(
        private authDataService: AuthDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.relationship) {
            // reset reversing action if the relationship was changed
            this.canReverseRelation = true;

            const relationship: SimpleChange = changes.relationship;
            this.updateRelationshipData(relationship.currentValue);
            // condition the reversing persons action if any of them is contact type
            _.map(relationship.currentValue.persons, (person) => {
                if (person.type === EntityType.CONTACT) {
                    this.canReverseRelation = false;
                }
            });
        }

    }

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

    private getRelationshipLink() {
        // get source person
        const sourcePerson = this.relationship.sourcePerson;

        if (sourcePerson) {
            return `/relationships/${sourcePerson.type}/${sourcePerson.id}/contacts/${this.relationship.id}/view`;
        }

        return null;
    }

    reverseExistingRelationship() {
        const relationshipPersons = {
            sourceId: _.find(this.relationship.persons, {target: true}).id,
            targetId: this.relationship.sourcePerson.id
        };
        this.relationshipDataService
            .reverseExistingRelationship(
                this.selectedOutbreak.id,
                this.relationship.id,
                relationshipPersons
            )
            .subscribe(() => this.onReverseRelationshipPersons());
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

    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }
}
