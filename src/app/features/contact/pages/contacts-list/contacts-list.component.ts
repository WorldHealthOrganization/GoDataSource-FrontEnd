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
    contactsOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    constructor(
        private contactDataService: ContactDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve gender list
        this.genderList$ = this.genericDataService.getGendersList();
    }

    ngOnInit() {
        // refresh listview
        this.loadContactsList();
    }

    /**
     * Re(load) the Contacts list
     */
    loadContactsList() {
        // get current outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((currentOutbreak: OutbreakModel) => {
                // keep outbreak to use later
                this.contactsOutbreak = currentOutbreak;

                // get the list of existing contacts
                this.contactsList$ = this.contactDataService.getContactsList(currentOutbreak.id, this.contactsListQueryBuilder);
            });
    }

    /**
     * Filter the Contacts list by some field
     * @param property
     * @param value
     */
    filterBy(property, value, valueTo) {
        // clear filter ?
        if (_.isEmpty(value) && _.isEmpty(valueTo)) {
            this.contactsListQueryBuilder.whereRemoveCondition(property);
        } else {
            // filter by any User property
            switch (property) {
                case 'age':
                    // between
                    if (!_.isEmpty(value) && !_.isEmpty(valueTo)) {
                        this.contactsListQueryBuilder.where({
                            [property]: {
                                between: [value, valueTo]
                            }
                        });
                    } else {
                        this.contactsListQueryBuilder.where({
                            [property]: {
                                [_.isEmpty(valueTo) ? 'gte' : 'lte']: _.isEmpty(valueTo) ? value : valueTo
                            }
                        });
                    }

                    break;

                default:
                    // contains
                    this.contactsListQueryBuilder.where({
                        [property]: {
                            regexp: `/${value}/i`
                        }
                    });
            }
        }

        // refresh users list
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
                .deleteContact(this.contactsOutbreak.id, contact.id)
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
