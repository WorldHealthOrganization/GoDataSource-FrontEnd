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
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ExposureTypeGroupModel } from '../../../../core/models/exposure-type-group';
import { ExposureTypeModel } from '../../../../core/models/exposure-type';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import {
    ReferenceDataCategory,
    ReferenceDataCategoryModel,
    ReferenceDataEntryModel
} from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-list.component.html',
    styleUrls: ['./contacts-list.component.less']
})
export class ContactsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
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
    riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

    // provide constants to template
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private contactDataService: ContactDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService) {
        super(listFilterDataService, route.queryParams);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.genericDataService.getGenderList();

        const riskLevel$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.RISK_LEVEL).share();
        this.riskLevelsList$ = riskLevel$.map((data: ReferenceDataCategoryModel) => {
            return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                new LabelValuePair(entry.value, entry.id)
            );
        });
        riskLevel$.subscribe((riskCategory: ReferenceDataCategoryModel) => {
            this.riskLevelsListMap = _.transform(
                riskCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });

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
        const columns = [
            'firstName',
            'lastName',
            'age',
            'gender',
            'phoneNumber',
            'riskLevel',
            'actions'
        ];

        return columns;
    }

    /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
    getRiskColor(item: ContactModel) {
        // get risk data color
        const riskData = _.get(this.riskLevelsListMap, item.riskLevel);
        if (riskData) {
            return riskData.colorCode ? riskData.colorCode : '';
        }

        // if we don't have risk data?
        return '';
    }

    /**
     * Delete specific contact that belongs to the selected outbreak
     * @param {ContactModel} contact
     */
    deleteContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT', contact)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.contactDataService
                        .deleteContact(this.selectedOutbreak.id, contact.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

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
