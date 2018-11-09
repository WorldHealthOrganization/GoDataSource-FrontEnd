import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AppliedFilterModel, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-contact-range-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-range-follow-ups-list.component.html',
    styleUrls: ['./contact-range-follow-ups-list.component.less']
})
export class ContactRangeFollowUpsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_CONTACTS_TITLE',
            '/contacts'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_TITLE',
            '.',
            true
        )
    ];

    // authenticated user
    authUser: UserModel;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // follow ups list
    followUpsGroupedByContact: {
        contact: ContactModel,
        followUps: FollowUpModel[]
    }[];

    // side filters
    availableSideFilters: FilterModel[];
    appliedSideFilters: AppliedFilterModel[];

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected snackbarService: SnackbarService
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
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;

                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // side filters
        this.initializeSideFilters();
    }

    /**
     * Initialize Side Filters
     */
    initializeSideFilters() {
        // set available side filters
        // Follow-ups
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                type: FilterType.RANGE_DATE
            })
        ];

        // set initial side filters
        const dateFilter = new AppliedFilterModel();
        dateFilter.readonly = true;
        dateFilter.filter = _.find(this.availableSideFilters, { fieldName: 'date' });
        dateFilter.value = {
            startDate: moment().add(-1, 'days').startOf('day').format(),
            endDate: moment().add(10, 'days').endOf('day').format()
        };

        // display in side filters
        this.appliedSideFilters = [dateFilter];

        // setup list query builder
        this.queryBuilder.filter.byDateRange(
            'date',
            dateFilter.value
        );
    }

    /**
     * Refresh list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Follow Ups
            this.followUpsDataService
                .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
                .subscribe((followUps: FollowUpModel[]) => {
                    this.followUpsGroupedByContact = _.chain(followUps)
                        .groupBy('personId')
                        .sortBy((data: FollowUpModel[]) => {
                            return data[0].contact.name.toLowerCase();
                        })
                        .map((data: FollowUpModel[]) => {
                            return {
                                contact: data[0].contact,
                                followUps: _.groupBy(data, (followUp: FollowUpModel) => {
                                    // contact information not needed anymore
                                    delete followUp.contact;

                                    // sort by date ascending
                                    return moment(followUp.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                })
                            };
                        })
                        .value();


                    console.log(this.followUpsGroupedByContact);
                });
        }
    }
}
