import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ExposureTypeGroupModel } from '../../../../core/models/exposure-type-group';
import { ExposureTypeModel } from '../../../../core/models/exposure-type';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-list.component.html',
    styleUrls: ['./contacts-list.component.less']
})
export class ContactsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing contacts
    contactsList$: Observable<ContactModel[]>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    // new contacts grouped by exposure types
    countedNewContactsGroupedByExposureType$: Observable<any[]>;

    // risk level
    riskLevelsList$: Observable<any[]>;

    constructor(
        private contactDataService: ContactDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve gender list
        this.genderList$ = this.genericDataService.getGendersList();

        // risk level
        this.riskLevelsList$ = this.genericDataService.getCaseRiskLevelsList();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // get new contacts grouped by exposure types
                if (this.selectedOutbreak) {
                    this.countedNewContactsGroupedByExposureType$ = this.contactDataService
                        .getNewContactsGroupedByExposureType(this.selectedOutbreak.id)
                        .map((data: ExposureTypeGroupModel) => {
                            return _.map(data ? data.exposureType : [], (item: ExposureTypeModel) => {
                                return new CountedItemsListItem(
                                    item.count,
                                    item.id
                                );
                            });
                        });
                }

                // re-load the list when the Selected Outbreak is changed
                this.refreshList();
            });
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Contacts
            this.contactsList$ = this.contactDataService.getContactsList(this.selectedOutbreak.id, this.queryBuilder);
        }
    }

    /**
     * Check if we have write access to contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Check if we have write access to follow-ups
     * @returns {boolean}
     */
    hasFollowUpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'age', 'gender', 'phoneNumber', 'riskLevel'];

        // check if the authenticated user has WRITE access
        if (this.hasContactWriteAccess()) {
            columns.push('actions');
        }

        return columns;
    }

    /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
    getRiskColor(item: ContactModel) {
        switch (item.riskLevel) {
            // #TODO - replace with reference data logic when implemented
            case 'low':
                return '#5ec800';
            case 'medium':
                return '#f69a0c';
            case 'high':
                return '#F90909';

            default:
                return '';
        }
    }

    /**
     * Delete specific contact that belongs to the selected outbreak
     * @param {ContactModel} contact
     */
    deleteContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT', contact)
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
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
                            this.refreshList();
                        });
                }
            });
    }

    /**
     * #TODO
     */
    filterByRelationshipExposureType(item) {
        // #TODO
        // this function will be replaced by search criteria inside a relationship
        // we can't do this right now since we can't search by relationship data
        console.log('#TODO', item);
    }
}
