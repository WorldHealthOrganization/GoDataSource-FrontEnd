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
import { Router } from '@angular/router';
import { EntityModel } from '../../../../core/models/entity.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogConfiguration, DialogField } from '../../../../shared/components';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

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

    // available side filters
    availableSideFilters: FilterModel[] = [];

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
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize side filters
        this.initializeSideFilters();

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
     * Initialize Side Filters
     */
    initializeSideFilters() {
        // set available side filters
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'type',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_TYPE',
                type: FilterType.MULTISELECT,
                options$: this.genericDataService.getEntityTypeOptions()
            })
        ];
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
            this.duplicatesListCount$ = this.outbreakDataService.getPeoplePossibleDuplicatesCount(this.selectedOutbreak.id, countQueryBuilder).share();
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
