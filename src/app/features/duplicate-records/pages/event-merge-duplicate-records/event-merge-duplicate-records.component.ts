import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityModel } from '../../../../core/models/entity.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { AddressModel } from '../../../../core/models/address.model';
import * as _ from 'lodash';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-event-merge-duplicate-records',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './event-merge-duplicate-records.component.html',
    styleUrls: ['./event-merge-duplicate-records.component.less']
})
export class EventMergeDuplicateRecordsComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '/duplicated-records'),
        new BreadcrumbItemModel('LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    // selected outbreak ID
    outbreakId: string;

    // loading flag - display spinner instead of table
    displayLoading: boolean = false;

    mergeRecordIds: string[];
    mergeRecords: EntityModel[];

    address: AddressModel = new AddressModel();

    uniqueOptions: {
        name: {
            options: LabelValuePair[],
            value: any
        },
        date: {
            options: LabelValuePair[],
            value: any
        },
        dateOfReporting: {
            options: LabelValuePair[],
            value: any
        },
        isDateOfReportingApproximate: {
            options: LabelValuePair[],
            value: any
        },
        description: {
            options: LabelValuePair[],
            value: any
        },
        address: {
            options: LabelValuePair[],
            value: any
        }
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        super();
    }

    ngOnInit() {
        // get merge ids
        // retrieve query params
        this.displayLoading = true;
        this.route.queryParams
            .subscribe((params: { ids }) => {
                // record ids
                this.mergeRecordIds = JSON.parse(params.ids);

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // retrieve records
                        const qb = new RequestQueryBuilder();
                        qb.filter.bySelect(
                            'id',
                            this.mergeRecordIds,
                            true,
                            null
                        );
                        this.outbreakDataService
                            .getPeopleList(this.outbreakId, qb)
                            .subscribe((recordMerge) => {
                                // merge records
                                this.mergeRecords = recordMerge;

                                // determine unique values
                                this.determineUniqueValues();

                                // finished
                                this.displayLoading = false;
                            });
                    });
            });
    }

    /**
     * Determine dropdown values
     */
    determineUniqueValues() {
        // initialize
        this.uniqueOptions = {
            name: {
                options: [],
                value: undefined
            },
            date: {
                options: [],
                value: undefined
            },
            dateOfReporting: {
                options: [],
                value: undefined
            },
            isDateOfReportingApproximate: {
                options: [],
                value: undefined
            },
            description: {
                options: [],
                value: undefined
            },
            address: {
                options: [],
                value: undefined
            }
        };

        // determine unique values
        if (this.mergeRecords) {
            this.uniqueOptions.name = EntityModel.uniqueStringOptions(this.mergeRecords, 'name');
            this.uniqueOptions.date = EntityModel.uniqueDateOptions(this.mergeRecords, 'date');
            this.uniqueOptions.dateOfReporting = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfReporting');
            this.uniqueOptions.isDateOfReportingApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfReportingApproximate');
            this.uniqueOptions.description = EntityModel.uniqueStringOptions(this.mergeRecords, 'description');
            this.uniqueOptions.address = EntityModel.uniqueAddressOptions(this.mergeRecords, 'address');

            // address
            this.address = this.uniqueOptions.address.value ? this.uniqueOptions.address.value : new AddressModel();
        }
    }

    /**
     * Address changed
     * @param data
     */
    changedAddress(data: LabelValuePair) {
        this.address = data ? data.value : new AddressModel();
    }

    /**
     * Create Event
     * @param {NgForm[]} stepForms
     */
    createNewEvent(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // sanitize
        delete dirtyFields.selectedAddress;

        // merge records
        if (!_.isEmpty(dirtyFields)) {
            if (this.formHelper.isFormsSetValid(stepForms)) {
                // add the new Event
                this.displayLoading = true;
                this.outbreakDataService
                    .mergePeople(
                        this.outbreakId,
                        EntityType.EVENT,
                        this.mergeRecordIds,
                        dirtyFields
                    )
                    .pipe(
                        catchError((err) => {
                            this.displayLoading = false;
                            this.snackbarService.showError(err.message);
                            return throwError(err);
                        })
                    )
                    .subscribe(() => {
                        this.snackbarService.showSuccess('LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_MERGE_EVENTS_SUCCESS_MESSAGE');

                        // navigate to listing page
                        this.disableDirtyConfirm();
                        this.router.navigate(['/duplicated-records']);
                    });
            } else {
                this.snackbarService.showError('LNG_FORM_ERROR_FORM_INVALID');
            }
        }
    }
}
