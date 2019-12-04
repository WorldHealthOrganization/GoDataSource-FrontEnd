import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { PeoplePossibleDuplicateModel } from '../../../../core/models/people-possible-duplicate.model';
import { EntityType } from '../../../../core/models/entity-type';
import { AddressModel } from '../../../../core/models/address.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { FormControl, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { share, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-duplicate-records-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './duplicate-records-list.component.html',
    styleUrls: ['./duplicate-records-list.component.less']
})
export class DuplicateRecordsListComponent extends ListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    outbreakSubscriber: Subscription;

    // constants
    EntityType = EntityType;
    AddressModel = AddressModel;
    EntityModel = EntityModel;

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
        private router: Router,
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
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Re(load) the list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve the list
            this.duplicatesList = null;
            this.outbreakDataService
                .getPeoplePossibleDuplicates(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(tap((duplicatesList) => {
                    this.checkEmptyList(duplicatesList.groups);
                }))
                .subscribe((duplicatesList) => {
                    this.duplicatesList = duplicatesList;

                    // finished
                    finishCallback([]);
                });
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
            this.duplicatesListCount$ = this.outbreakDataService.getPeoplePossibleDuplicatesCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
        }
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
    hasAtLeastTwoCheckboxChecked(form: NgForm): boolean {
        // set children checkboxes values
        let checkedItems: number = 0;
        _.each(form.controls, (checkbox: FormControl, name: string) => {
            if (
                name !== 'checkAll' &&
                checkbox.value
            ) {
                checkedItems++;
                if (checkedItems > 1) {
                    return false;
                }
            }
        });

        // finished
        return checkedItems === 2;
    }

    /**
     * Merge records
     * @param form
     */
    mergeCheckedRecords(form: NgForm) {
        // determine merge ids
        const mergeIds: string[] = [];
        _.each(form.controls, (checkbox: FormControl, name: string) => {
            if (
                name !== 'checkAll' &&
                checkbox.value
            ) {
                // determine id
                const id: string = name.substring(
                    name.indexOf('[') + 1,
                    name.indexOf(']')
                );

                // add it to merge list
                mergeIds.push(id);
            }
        });

        // determine if we have multiple types that we want ot merge
        const types: EntityType[] = _.chain(mergeIds)
            .map((id: string) => this.duplicatesList.peopleMap[id])
            .uniqBy('type')
            .map('type')
            .filter((type: EntityType) => {
                // check permissions
                switch (type) {
                    case EntityType.CASE:
                        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
                    case EntityType.CONTACT:
                        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
                    case EntityType.EVENT:
                        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
                }
            })
            .value();

        // we shouldn't be able to merge two types...
        if (types.length > 1) {
            this.snackbarService.showError('LNG_PAGE_LIST_DUPLICATE_RECORDS_MERGE_NOT_SUPPORTED');
            return;
        }

        // check if we have write access to any of the present types
        if (types.length < 1) {
            this.snackbarService.showError('LNG_PAGE_LIST_DUPLICATE_RECORDS_NO_WRITE_ACCESS');
            return;
        }

        // redirect to merge page
        this.router.navigate(
            ['/duplicated-records', EntityModel.getLinkForEntityType(types[0]), 'merge'], {
                queryParams: {
                    ids: JSON.stringify(mergeIds)
                }
            }
        );
    }
}
