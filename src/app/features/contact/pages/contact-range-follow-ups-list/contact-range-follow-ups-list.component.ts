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
import * as _ from 'lodash';
import * as moment from 'moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { Constants } from '../../../../core/models/constants';
import { Moment } from 'moment';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogField, LoadingDialogModel } from '../../../../shared/components';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormDateRangeSliderData } from '../../../../shared/xt-forms/components/form-date-range-slider/form-date-range-slider.component';

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
        followUps: {
            [date: string]: FollowUpModel[]
        }
    }[] = [];
    daysToDisplay: string[] = [];
    dailyStatuses: {
        // status ID => Status
        [statusId: string]: ReferenceDataEntryModel
    } = {};

    // loading flag - display spinner instead of table
    displayLoading: boolean = false;

    // export
    exportRangeFollowUpsUrl: string;
    exportRangeFollowUpsFileName: string;
    exportRangeExtraAPIData: {
        [key: string]: any
    };
    exportRangeExtraDialogFields: DialogField[];

    // constants
    ExportDataExtension = ExportDataExtension;
    ReferenceDataCategory = ReferenceDataCategory;

    loadingDialog: LoadingDialogModel;

    /**
     * Filter slider data
     */
    slideFilterData: {
        minDate: Moment,
        maxDate: Moment,
        maxRange: number
    } = {
        minDate: moment().startOf('day'),
        maxDate: moment().endOf('day'),
        maxRange: 0
    };

    /**
     * Slider Date Filter Value
     */
    sliderDateFilterValue: FormDateRangeSliderData;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // add page title
        this.exportRangeFollowUpsFileName = this.i18nService.instant('LNG_PAGE_LIST_RANGE_FOLLOW_UPS_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');

        // retrieve group by options
        this.genericDataService
            .getRangeFollowUpGroupByOptions()
            .subscribe((options) => {
                this.exportRangeExtraDialogFields = [
                    new DialogField({
                        name: 'groupBy',
                        placeholder: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                        inputOptions: options,
                        value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                        required: true
                    })
                ];
            });

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;

                // export url
                this.exportRangeFollowUpsUrl = null;
                this.slideFilterData = {
                    minDate: moment().startOf('day'),
                    maxDate: moment().endOf('day'),
                    maxRange: 0
                };
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportRangeFollowUpsUrl = `outbreaks/${this.selectedOutbreak.id}/contacts/range-list/export`;

                    // set filter slider info
                    this.slideFilterData.minDate = moment(this.selectedOutbreak.startDate).startOf('day');
                    this.slideFilterData.maxDate = moment().add(this.selectedOutbreak.periodOfFollowup, 'days').endOf('day');
                    this.slideFilterData.maxRange = this.selectedOutbreak.periodOfFollowup;
                    this.sliderDateFilterValue = new FormDateRangeSliderData({
                        low: moment(),
                        high: moment().add(this.selectedOutbreak.periodOfFollowup, 'days')
                    });

                    // filter
                    this.filterByDateRange(this.sliderDateFilterValue);
                }

                // daily status colors
                this.referenceDataDataService
                    .getReferenceDataByCategory(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS)
                    .subscribe((data: ReferenceDataCategoryModel) => {
                        this.dailyStatuses = {};
                        _.each(data.entries, (entry: ReferenceDataEntryModel) => {
                            this.dailyStatuses[entry.id] = entry;
                        });
                    });

                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

    }

    /**
     * Refresh list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Follow Ups
            this.displayLoading = true;
            this.followUpsGroupedByContact = [];
            this.followUpsDataService
                .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
                .subscribe((followUps: FollowUpModel[]) => {
                    // determine follow-up questionnaire alertness
                    followUps = FollowUpModel.determineAlertness(
                        this.selectedOutbreak.contactFollowUpTemplate,
                        followUps
                    );

                    // group contact information
                    let minDate: Moment;
                    let maxDate: Moment;
                    this.followUpsGroupedByContact = _.chain(followUps)
                        .groupBy('personId')
                        .sortBy((data: FollowUpModel[]) => {
                            return data[0].contact.name.toLowerCase();
                        })
                        .map((data: FollowUpModel[]) => {
                            return {
                                contact: data[0].contact,
                                followUps: _.chain(data)
                                    .groupBy((followUp: FollowUpModel) => {
                                        // contact information not needed anymore
                                        delete followUp.contact;

                                        // determine min & max dates
                                        const date = moment(followUp.date).startOf('day');
                                        if (followUp.statusId) {
                                            minDate = minDate ?
                                                (date.isBefore(minDate) ? date : minDate) :
                                                date;
                                            maxDate = maxDate ?
                                                (date.isAfter(maxDate) ? moment(date) : maxDate) :
                                                moment(date);
                                        }

                                        // sort by date ascending
                                        return date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                    })
                                    .mapValues((followUpData: FollowUpModel[]) => {
                                        return _.sortBy(
                                            followUpData,
                                            (followUp: FollowUpModel) => {
                                                return moment(followUp.date);
                                            }
                                        );
                                    })
                                    .value()
                            };
                        })
                        .value();

                    // create dates array
                    this.exportRangeExtraAPIData = undefined;
                    this.daysToDisplay = [];
                    if (
                        minDate &&
                        maxDate
                    ) {
                        // set export data
                        this.exportRangeExtraAPIData = {
                            startDate: minDate.startOf('day').format(),
                            endDate: maxDate.endOf('day').format()
                        };

                        // push dates
                        while (minDate.isSameOrBefore(maxDate)) {
                            // add day to list
                            this.daysToDisplay.push(minDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));

                            // next day
                            minDate.add('1', 'days');
                        }
                    }

                    // display data
                    this.displayLoading = false;
                });
        }
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }

    /**
     * Filter by slider value
     */
    filterByDateRange(value: FormDateRangeSliderData) {
        // set the new value
        this.sliderDateFilterValue = value;

        // filter
        this.queryBuilder.filter.byDateRange(
            'date', {
                startDate: moment(this.sliderDateFilterValue.low).startOf('day'),
                endDate: moment(this.sliderDateFilterValue.high).endOf('day')
            }
        );

        // set export data
        this.exportRangeExtraAPIData = {
            startDate: moment(this.sliderDateFilterValue.low).startOf('day'),
            endDate: moment(this.sliderDateFilterValue.high).endOf('day')
        };

        // refresh list
        this.needsRefreshList();
    }
}
