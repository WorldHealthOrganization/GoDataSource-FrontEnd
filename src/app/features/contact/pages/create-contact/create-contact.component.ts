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
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { RelationshipModel, RelationshipPersonModel } from '../../../../core/models/relationship.model';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-create-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact.component.html',
    styleUrls: ['./create-contact.component.less']
})
export class CreateContactComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    // selected outbreak ID
    outbreakId: string;

    contactData: ContactModel = new ContactModel();
    ageSelected: boolean = true;

    genderList$: Observable<any[]>;

    relatedEntityData: CaseModel|EventModel;
    relationship: RelationshipModel = new RelationshipModel();

    Constants = Constants;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService
    ) {
        this.genderList$ = this.genericDataService.getGenderList();
    }

    ngOnInit() {
        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());

        // ...and a document
        this.contactData.documents.push(new DocumentModel());

        // retrieve query params
        this.route.queryParams
            .subscribe((params: {entityType, entityId}) => {
                const entityType: EntityType = _.get(params, 'entityType');
                const entityId: string = _.get(params, 'entityId');

                // check if we have proper values ( case or event ID )
                if (
                    !entityType ||
                    !entityId
                ) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

                    // navigate to Cases/Events listing page
                    if (entityType === EntityType.EVENT) {
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
                        this.router.navigate(['/cases']);
                        return ErrorObservable.create(err);
                    })
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // retrieve Case/Event information
                        this.entityDataService
                            .getEntity(entityType, selectedOutbreak.id, entityId)
                            .catch((err) => {
                                // show error message
                                this.snackbarService.showError(err.message);

                                // navigate to Cases/Events listing page
                                if (entityType === EntityType.EVENT) {
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
                                        id: entityId
                                    })
                                );
                            });
                    });
            });
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
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

        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields) &&
            !_.isEmpty(relationship)
        ) {
            // add the new Contact
            this.contactDataService
                .createContact(this.outbreakId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

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
                            this.snackbarService.showError(err.message);

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
                            this.router.navigate(['/contacts']);
                        });
                });
        }
    }
}
