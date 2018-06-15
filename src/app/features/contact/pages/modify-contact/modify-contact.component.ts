import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { ContactModel } from '../../../../core/models/contact.model';


@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact.component.html',
    styleUrls: ['./modify-contact.component.less']
})
export class ModifyContactComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Contacts', '/contacts'),
        new BreadcrumbItemModel('Modify Contact', '.', true)
    ];

    contactData: ContactModel = new ContactModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;
    locationsList$: Observable<LocationModel[]>;
    documentTypesList$: Observable<any[]>;

    constructor(
        private genericDataService: GenericDataService,
        private locationDataService: LocationDataService,
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
        this.locationsList$ = this.locationDataService.getLocationsList();
        this.documentTypesList$ = this.genericDataService.getDocumentTypesList();
    }

    ngOnInit() {
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

    modifyContact(form: NgForm) {
    }
}
