import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityModel } from '../../../../core/models/entity.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

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

    eventData: EventModel = new EventModel();

    mergeRecordIds: string[];
    mergeRecords: EntityModel[];

    uniqueOptions: {
        name: LabelValuePair[],
        date: LabelValuePair[],
        dateOfReporting: LabelValuePair[],
        isDateOfReportingApproximate: LabelValuePair[],
        description: LabelValuePair[]
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventDataService: EventDataService,
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
            description: []
        };

        // determine unique values
        if (this.mergeRecords) {
            this.uniqueOptions.name = EntityModel.uniqueValueOptions(this.mergeRecords, 'name');
        }

        console.log(this.uniqueOptions);
    }

    /**
     * Create Event
     * @param {NgForm[]} stepForms
     */
    createNewEvent(stepForms: NgForm[]) {
        // // get forms fields
        // const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        //
        // if (
        //     this.formHelper.isFormsSetValid(stepForms) &&
        //     !_.isEmpty(dirtyFields)
        // ) {
        //     // add the new Event
        //     this.eventDataService
        //         .createEvent(this.outbreakId, dirtyFields)
        //         .catch((err) => {
        //             this.snackbarService.showError(err.message);
        //
        //             return ErrorObservable.create(err);
        //         })
        //         .subscribe(() => {
        //             this.snackbarService.showSuccess('LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_SUCCESS_MESSAGE');
        //
        //             // navigate to listing page
        //             this.disableDirtyConfirm();
        //             this.router.navigate(['/events']);
        //         });
        // }
    }
}
