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
import { RelationshipModel, RelationshipPersonModel, RelationshipType } from '../../../../core/models/relationship.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-create-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact.component.html',
    styleUrls: ['./create-contact.component.less']
})
export class CreateContactComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Contacts', '/contacts'),
        new BreadcrumbItemModel('Create New Contact', '.', true)
    ];

    contactData: ContactModel = new ContactModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;

    caseData: CaseModel;
    relationship: RelationshipModel;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private caseDataService: CaseDataService,
        private relationshipDataService: RelationshipDataService
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
    }

    ngOnInit() {
        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());

        // ...and a document
        this.contactData.documents.push(new DocumentModel());

        // init the first relationship
        this.relationship = new RelationshipModel();

        // retrieve query params
        this.route.queryParams
            .subscribe(params => {
                // check if we have proper values ( case & outbreak )
                if (!params.caseId) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_REQUIRED');

                    // navigate to case listing page
                    this.router.navigate(['/cases']);
                    return;
                }

                // update breadcrumb
                const createBreadcrumb = _.find(this.breadcrumbs, { link: '.' });
                if (createBreadcrumb) {
                    createBreadcrumb.params.caseId = params.caseId;
                }

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
                        // retrieve case information
                        this.caseDataService
                            .getCase(selectedOutbreak.id, params.caseId)
                            .catch((err) => {
                                // show error message
                                this.snackbarService.showError(err.message);

                                // redirect to cases
                                this.router.navigate(['/cases']);
                                return ErrorObservable.create(err);
                            })
                            .subscribe((caseData: CaseModel) => {
                                // initialize case
                                // add case to list
                                this.caseData = caseData;
                                this.relationship.persons.push(new RelationshipPersonModel(this.caseData.id));
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
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // add the new Contact
                    this.contactDataService
                        .createContact(selectedOutbreak.id, dirtyFields)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe((contactData: ContactModel) => {
                            this.relationshipDataService
                                .createRelationship(selectedOutbreak.id, RelationshipType.CONTACT, contactData.id, relationship)
                                .catch((err) => {
                                    // display error message
                                    this.snackbarService.showError(err.message);

                                    // remove contact
                                    this.contactDataService
                                        .deleteContact(selectedOutbreak.id, contactData.id)
                                        .catch((errDC) => {
                                            return ErrorObservable.create(errDC);
                                        })
                                        .subscribe();

                                    // finished
                                    return ErrorObservable.create(err);
                                })
                                .subscribe(() => {
                                    this.snackbarService.showSuccess('Contact added!');

                                    // navigate to listing page
                                    this.router.navigate(['/contacts']);
                                });
                        });
                });
        }
    }
}
