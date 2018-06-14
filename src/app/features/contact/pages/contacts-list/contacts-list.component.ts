import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
// import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
// import { UserModel } from '../../../../core/models/user.model';
// import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
// import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
// import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-list.component.html',
    styleUrls: ['./contacts-list.component.less']
})
export class ContactsListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Contacts', '.', true)
    ];

    // authenticated user
    // authUser: UserModel;

    // list of existing contacts
    contactsList$: Observable<ContactModel[]>;
    contactsListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    // caseClassificationsList$: Observable<any[]>;

    constructor(
        private contactDataService: ContactDataService,
        // private authDataService: AuthDataService,
        // private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        // private genericDataService: GenericDataService
    ) {
        // get the authenticated user
        // this.authUser = this.authDataService.getAuthenticatedUser();

        // this.caseClassificationsList$ = this.genericDataService.getCaseClassificationsList();

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
                // get the list of existing contacts
                this.contactsList$ = this.contactDataService.getContactsList(currentOutbreak.id, this.contactsListQueryBuilder);
            });
    }

    /**
     * Filter the Contacts list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // // filter by any User property
        // this.casesListQueryBuilder.where({
        //     [property]: {
        //         regexp: `/^${value}/i`
        //     }
        // });
        //
        // // refresh users list
        // this.loadContactsList();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName'];

        // // check if the authenticated user has WRITE access
        // if (this.authUser.hasPermissions(PERMISSION.WRITE_CASE)) {
        //     columns.push('actions');
        // }

        return columns;
    }

}
