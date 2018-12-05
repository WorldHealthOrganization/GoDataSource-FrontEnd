import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable } from 'rxjs/Observable';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { RelationshipModel, RelationshipPersonModel } from '../../../../core/models/relationship.model';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-create-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact.component.html',
    styleUrls: ['./create-contact.component.less']
})
export class CreateContactComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    // selected outbreak ID
    outbreakId: string;

    contactData: ContactModel = new ContactModel();

    entityType: EntityType;
    entityId: string;

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    relatedEntityData: CaseModel|EventModel;
    relationship: RelationshipModel = new RelationshipModel();

    serverToday: Moment = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.contactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        // retrieve query params
        this.route.queryParams
            .subscribe((params: {entityType, entityId}) => {
                this.entityType = _.get(params, 'entityType');
                this.entityId = _.get(params, 'entityId');

                // check if we have proper values ( case or event ID )
                if (
                    !this.entityType ||
                    !this.entityId
                ) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

                    // navigate to Cases/Events listing page
                    this.disableDirtyConfirm();
                    if (this.entityType === EntityType.EVENT) {
                        this.router.navigate(['/events']);
                    } else {
                        this.router.navigate(['/cases']);
                    }

                    return;
                }

                // update breadcrumbs
                this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true));

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .catch((err) => {
                        // show error message
                        this.snackbarService.showError(err.message);

                        // redirect to cases
                        this.disableDirtyConfirm();
                        this.router.navigate(['/cases']);
                        return ErrorObservable.create(err);
                    })
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // retrieve Case/Event information
                        this.entityDataService
                            .getEntity(this.entityType, selectedOutbreak.id, this.entityId)
                            .catch((err) => {
                                // show error message
                                this.snackbarService.showError(err.message);

                                // navigate to Cases/Events listing page
                                this.disableDirtyConfirm();
                                if (this.entityType === EntityType.EVENT) {
                                    this.router.navigate(['/events']);
                                } else {
                                    this.router.navigate(['/cases']);
                                }

                                return ErrorObservable.create(err);
                            })
                            .subscribe((relatedEntityData: CaseModel|EventModel) => {
                                // initialize Case/Event
                                this.relatedEntityData = relatedEntityData;
                                this.relationship.persons.push(
                                    new RelationshipPersonModel({
                                        id: this.entityId
                                    })
                                );
                            });
                    });
            });
    }

    /**
     * Create Contact
     * @param {NgForm[]} stepForms
     */
    createNewContact(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        const relationship = _.get(dirtyFields, 'relationship');
        delete dirtyFields.relationship;

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // create relationship & contact
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields) &&
            !_.isEmpty(relationship)
        ) {
            // add the new Contact
            this.contactDataService
                .createContact(this.outbreakId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showApiError(err);

                    return ErrorObservable.create(err);
                })
                .subscribe((contactData: ContactModel) => {
                    this.relationshipDataService
                        .createRelationship(
                            this.outbreakId,
                            EntityType.CONTACT,
                            contactData.id,
                            relationship
                        )
                        .catch((err) => {
                            // display error message
                            this.snackbarService.showApiError(err);

                            // remove contact
                            this.contactDataService
                                .deleteContact(this.outbreakId, contactData.id)
                                .catch((errDC) => {
                                    return ErrorObservable.create(errDC);
                                })
                                .subscribe();

                            // finished
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                            // navigate to listing page
                            this.disableDirtyConfirm();
                            this.router.navigate([`/contacts/${contactData.id}/modify`]);
                        });
                });
        }
    }
}
