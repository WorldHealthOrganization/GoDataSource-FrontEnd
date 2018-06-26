import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-list.component.html',
    styleUrls: ['./contacts-list.component.less']
})
export class ContactsListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Contacts', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing contacts
    contactsList$: Observable<ContactModel[]>;
    contactsListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    constructor(
        private contactDataService: ContactDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService
    ) {}

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve gender list
        this.genderList$ = this.genericDataService.getGendersList();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.loadContactsList();
            });
    }

    /**
     * Re(load) the Contacts list
     */
    loadContactsList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Contacts
            this.contactsList$ = this.contactDataService.getContactsList(this.selectedOutbreak.id, this.contactsListQueryBuilder);
        }
    }

    /**
     * Filter the Contacts list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // clear filter ?
        if (_.isEmpty(value)) {
            this.contactsListQueryBuilder.whereRemove(property);
        } else {
            // filter by any property
            switch (property) {
                case 'age':
                    if (_.isEmpty(value.from) && _.isEmpty(value.to)) {
                        this.contactsListQueryBuilder.whereRemove(property);
                    } else {
                        // determine operator & value
                        let operator;
                        let valueToCompare;
                        if (!_.isEmpty(value.from) && !_.isEmpty(value.to)) {
                            operator = 'between';
                            valueToCompare = [value.from, value.to];
                        } else if (!_.isEmpty(value.from)) {
                            operator = 'gte';
                            valueToCompare = value.from;
                        } else {
                            operator = 'lte';
                            valueToCompare = value.to;
                        }

                        // filter
                        this.contactsListQueryBuilder.where({
                            [property]: {
                                [operator]: valueToCompare
                            }
                        });
                    }
                    break;

                default:
                    // starts with
                    this.contactsListQueryBuilder.where({
                        [property]: {
                            regexp: `/^${value}/i`
                        }
                    });
            }
        }

        // refresh list
        this.loadContactsList();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'age', 'gender', 'phoneNumber'];

        // check if the authenticated user has WRITE access
        if (this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT)) {
            columns.push('actions');
        }

        return columns;
    }

    /**
     * Delete specific contact that belongs to the selected outbreak
     * @param {ContactModel} contact
     */
    deleteContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        if (confirm(`Are you sure you want to delete this contact: ${contact.firstName} ${contact.lastName}?`)) {
            // delete contact
            this.contactDataService
                .deleteContact(this.selectedOutbreak.id, contact.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('Contact deleted!');

                    // reload data
                    this.loadContactsList();
                });
        }
    }

}
