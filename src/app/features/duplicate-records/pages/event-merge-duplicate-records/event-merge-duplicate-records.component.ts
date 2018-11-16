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

    mergeRecordIds: string[];
    mergeRecords: EntityModel[];

    address: AddressModel = new AddressModel();

    uniqueOptions: {
        name: LabelValuePair[],
        date: LabelValuePair[],
        dateOfReporting: LabelValuePair[],
        isDateOfReportingApproximate: LabelValuePair[],
        description: LabelValuePair[],
        address: LabelValuePair[],
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
            name: [],
            date: [],
            dateOfReporting: [],
            isDateOfReportingApproximate: [],
            description: [],
            address: []
        };

        // determine unique values
        if (this.mergeRecords) {
            this.uniqueOptions.name = EntityModel.uniqueStringOptions(this.mergeRecords, 'name');
            this.uniqueOptions.date = EntityModel.uniqueDateOptions(this.mergeRecords, 'date');
            this.uniqueOptions.dateOfReporting = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfReporting');
            this.uniqueOptions.isDateOfReportingApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfReportingApproximate');
            this.uniqueOptions.description = EntityModel.uniqueStringOptions(this.mergeRecords, 'description');
            this.uniqueOptions.address = EntityModel.uniqueAddressOptions(this.mergeRecords, 'address');
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
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Event
            this.outbreakDataService
                .mergePeople(
                    this.outbreakId,
                    EntityType.EVENT,
                    this.mergeRecordIds,
                    dirtyFields
                ).catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_MERGE_EVENT_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate(['/duplicated-records']);
                });
        }
    }
}
