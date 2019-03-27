import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';

@Component({
    selector: 'app-relationship-summary',
    templateUrl: './relationship-summary.component.html',
    styleUrls: ['./relationship-summary.component.less']
})
export class RelationshipSummaryComponent implements OnInit, OnChanges {

    @Input() relationship: RelationshipModel;
    private _relationship: RelationshipModel;

    @Output() remove = new EventEmitter<void>();
    @Output() modifyRelationship = new EventEmitter<RelationshipModel>();
    @Output() deleteRelationship = new EventEmitter<RelationshipModel>();

    // authenticated user
    authUser: UserModel;

    relationshipData: LabelValuePair[] = [];

    constructor(
        private entityDataService: EntityDataService
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.relationship) {
            const relationship: SimpleChange = changes.relationship;
            this._relationship = relationship.currentValue;
            this.update(this._relationship);
        }

    }

    ngOnInit() {
        this.update(this.relationship);
    }

    update(relationship) {
        this.relationshipData = this.entityDataService.getLightObjectDisplay(relationship);
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
}
