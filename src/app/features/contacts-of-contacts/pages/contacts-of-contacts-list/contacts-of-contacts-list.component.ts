import {Component, OnInit} from '@angular/core';
import {ListComponent} from '../../../../core/helperClasses/list-component';
import {BreadcrumbItemModel} from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import {OutbreakModel} from '../../../../core/models/outbreak.model';
import {Observable} from 'rxjs';
import {ContactModel} from '../../../../core/models/contact.model';
import {ContactsOfContactsDataService} from '../../../../core/services/data/contacts-of-contacts.data.service';
import {share, tap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {ListFilterDataService} from '../../../../core/services/data/list-filter.data.service';
import {SnackbarService} from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-contacts-of-contacts-list',
    templateUrl: './contacts-of-contacts-list.component.html',
    styleUrls: ['./contacts-of-contacts-list.component.less']
})
export class ContactsOfContactsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '.', true)
    ];

    selectedOutbreak: OutbreakModel;

    contactsOfContactsList$: Observable<ContactModel[]>;
    contactsOfContactsListCount$: Observable<any>;

    constructor(
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private route: ActivatedRoute,
        protected listFilterDataService: ListFilterDataService,
        protected snackbarService: SnackbarService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {

            // retrieve the list of Contacts
            this.contactsOfContactsList$ = this.contactsOfContactsDataService
                .getContactsOfContacts(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    tap(this.checkEmptyList.bind(this)),
                    tap((data: any[]) => {
                        finishCallback(data);
                    })
                );
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.contactsOfContactsListCount$ = this.contactsOfContactsDataService.getContactsOfContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
        }
    }


}
