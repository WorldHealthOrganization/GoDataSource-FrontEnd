import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ContactChronology } from './typings/contact-chronology';
import { forkJoin } from 'rxjs/index';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-view-chronology-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-chronology-contact.component.html',
    styleUrls: ['./view-chronology-contact.component.less']
})
export class ViewChronologyContactComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    contactData: ContactModel = new ContactModel();
    chronologyEntries: ChronologyItem[] = [];

    constructor(
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        private relationshipDataService: RelationshipDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params: { contactId }) => {
            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // get contact
                    this.contactDataService
                        .getContact(selectedOutbreak.id, params.contactId)
                        .subscribe((contactDataReturned) => {
                            this.contactData = contactDataReturned;
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    contactDataReturned.name,
                                    `/contacts/${contactDataReturned.id}/view`),
                                new BreadcrumbItemModel(
                                    'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.contactData
                                )
                            );

                            // build query to get the followUps for specified contact
                            const qb = new RequestQueryBuilder;
                            qb.filter.byEquality(
                                'personId',
                                this.contactData.id
                            );

                            // build query to get the people for all relationships
                            const qqb = new RequestQueryBuilder();
                            qqb.include('people', true);

                            forkJoin(
                                // get relationships
                                this.relationshipDataService
                                    .getEntityRelationships(
                                        selectedOutbreak.id,
                                        this.contactData.type,
                                        this.contactData.id,
                                        qqb
                                    ),
                                this.followUpsDataService
                                    .getFollowUpsList(selectedOutbreak.id, qb)
                            ).subscribe(([relationshipsData, followUps]: [RelationshipModel[], FollowUpModel[]]) => {
                                // set data
                                this.chronologyEntries = ContactChronology.getChronologyEntries(this.i18nService, this.contactData, followUps, relationshipsData);
                            });

                        });
                });
        });
    }
}
