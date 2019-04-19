import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

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

    // authenticated user
    authUser: UserModel;

    relationshipData: LabelValuePair[] = [];

    relationshipLink: string;

    canReverseRelation: boolean = true;

    constructor(
        private authDataService: AuthDataService,
        private relationshipDataService: RelationshipDataService
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.relationship) {
            const relationship: SimpleChange = changes.relationship;
            this.updateRelationshipData(relationship.currentValue);
        }

    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

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
        console.log(this.relationship);
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

    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }
}
