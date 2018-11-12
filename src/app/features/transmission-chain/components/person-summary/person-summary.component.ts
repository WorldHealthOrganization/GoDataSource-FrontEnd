import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityModel } from '../../../../core/models/entity.model';

@Component({
    selector: 'app-person-summary',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './person-summary.component.html',
    styleUrls: ['./person-summary.component.less']
})
export class PersonSummaryComponent implements OnInit {
    @Input() person: (CaseModel | ContactModel | EventModel);

    @Output() remove = new EventEmitter<void>();

    personData: LabelValuePair[] = [];
    personLink: string;
    personChainLink: string;

    constructor(
        private entityDataService: EntityDataService
    ) {
    }

    ngOnInit() {
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
}


