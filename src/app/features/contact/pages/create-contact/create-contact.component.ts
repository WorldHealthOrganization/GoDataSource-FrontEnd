import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import * as _ from 'lodash';


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
    locationsList$: Observable<LocationModel[]>;
    documentTypesList$: Observable<any[]>;

    constructor(
        private router: Router,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
        this.locationsList$ = this.locationDataService.getLocationsList();
        this.documentTypesList$ = this.genericDataService.getDocumentTypesList();
    }

    ngOnInit() {
        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());

        // ...and a document
        this.contactData.documents.push(new DocumentModel());
    }

    /**
     * Add a new address slot in UI
     */
    addAddress() {
        this.contactData.addresses.push(new AddressModel());
    }

    /**
     * Remove an address from the list of addresses
     */
    deleteAddress(index) {
        this.contactData.addresses.splice(index, 1);
    }

    /**
     * Add a new document slot in UI
     */
    addDocument() {
        this.contactData.documents.push(new DocumentModel());
    }

    /**
     * Remove a document from the list of documents
     */
    deleteDocument(index) {
        this.contactData.documents.splice(index, 1);
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

        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
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
                        .subscribe(() => {
                            this.snackbarService.showSuccess('Contact added!');

                            // navigate to listing page
                            this.router.navigate(['/contacts']);
                        });
                });
        }
    }
}
