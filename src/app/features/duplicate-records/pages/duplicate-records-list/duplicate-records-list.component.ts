import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { PeoplePossibleDuplicateModel } from '../../../../core/models/people-possible-duplicate.model';
import { EntityType } from '../../../../core/models/entity-type';
import { AddressModel } from '../../../../core/models/address.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { FormControl, NgForm } from '@angular/forms';

@Component({
    selector: 'app-duplicate-records-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './duplicate-records-list.component.html',
    styleUrls: ['./duplicate-records-list.component.less']
})
export class DuplicateRecordsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    // constants
    EntityType = EntityType;
    AddressModel = AddressModel;

    // authenticated user
    authUser: UserModel;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // duplicates
    duplicatesList: PeoplePossibleDuplicateModel;
    duplicatesListCount$: Observable<any>;

    /**
     * Visible table columns
     */
    tableVisibleHeaderColumns: string[] = [
        'checkbox',
        'type',
        'firstName',
        'lastName',
        'documents',
        'age',
        'address'
    ];

    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) the list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.duplicatesList = null;
            this.outbreakDataService
                .getPeoplePossibleDuplicates(this.selectedOutbreak.id, this.queryBuilder)
                .subscribe((duplicatesList) => {
                    this.duplicatesList = duplicatesList;
                });
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
            this.duplicatesListCount$ = this.outbreakDataService.getPeoplePossibleDuplicatesCount(this.selectedOutbreak.id, countQueryBuilder);
        }
    }

    /**
     * Has write permissions ?
     */
    hasWritePermissions(id: string) {
        // check permissions
        switch (this.duplicatesList.peopleMap[id].type) {
            case EntityType.CASE:
                return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
            case EntityType.CONTACT:
                return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
            case EntityType.EVENT:
                return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
        }

        // unreachable code
        return false;
    }

    /**
     * Check all checkboxes
     * @param form
     */
    checkAllToggle(form: NgForm) {
        // toggle value
        const newValue: boolean = form.controls.checkAll.value;

        // set children checkboxes values
        _.each(form.controls, (checkbox: FormControl) => {
            checkbox.setValue(newValue);
        });
    }

    /**
     * Check all checkboxes
     * @param form
     */
    checkOneToggle(form: NgForm) {
        // set children checkboxes values
        let newValue: boolean = true;
        _.each(form.controls, (checkbox: FormControl, name: string) => {
            if (name !== 'checkAll') {
                newValue = newValue && checkbox.value;
            }
        });

        // set all checkbox value
        form.controls.checkAll.setValue(newValue);
    }

    /**
     * Determine if we have at least one checkbox checked
     * @param form
     */
    hasAtLeastOneCheckboxChecked(form: NgForm): boolean {
        // set children checkboxes values
        let newValue: boolean = false;
        _.each(form.controls, (checkbox: FormControl, name: string) => {
            if (
                name !== 'checkAll' &&
                checkbox.value
            ) {
                newValue = true;
                return false;
            }
        });

        // finished
        return newValue;
    }
}
