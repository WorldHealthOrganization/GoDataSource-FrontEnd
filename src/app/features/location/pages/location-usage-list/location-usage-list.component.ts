import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationUsageModel, UsageDetails, UsageDetailsItem, UsageDetailsItemType } from '../../../../core/models/location-usage.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Constants } from '../../../../core/models/constants';
import { HoverRowAction } from '../../../../shared/components';
import { EventModel } from '../../../../core/models/event.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-location-usage-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './location-usage-list.component.html',
    styleUrls: ['./location-usage-list.component.less']
})
export class LocationUsageListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    locationId: string;

    usageDetailsList: UsageDetailsItem[];
    usageDetailsListMore: {
        displayed: number,
        total: number
    };

    recordActions: HoverRowAction[] = [
        // View Item
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            click: (item: UsageDetailsItem) => {
                this.router.navigateByUrl(item.viewUrl);
            }
        }),

        // Modify Item
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
            click: (item: UsageDetailsItem) => {
                this.router.navigateByUrl(item.modifyUrl);
            },
            visible: (item: UsageDetailsItem): boolean => {
                return this.hasWriteAccess(item);
            }
        })
    ];

    constructor(
        private router: Router,
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private locationDataService: LocationDataService,
        private outbreakDataService: OutbreakDataService,
        protected route: ActivatedRoute
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { locationId }) => {
            this.locationId = params.locationId;

            // retrieve location
            this.locationDataService
                .getLocation(this.locationId)
                .subscribe((location: LocationModel) => {
                    // add breadcrumb
                    this.breadcrumbs = [
                        new BreadcrumbItemModel(
                            'LNG_PAGE_LIST_LOCATIONS_TITLE',
                            '/locations'
                        )
                    ];
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(
                            'LNG_PAGE_LIST_USAGE_LOCATIONS_TITLE',
                            '.',
                            true,
                            {},
                            location
                        )
                    );

                    // get usage list
                    this.needsRefreshList(true);
                });
        });
    }

    /**
     * Re(load) the list
     */
    refreshList(finishCallback: () => void) {
        if (this.locationId) {
            // retrieve outbreaks
            this.outbreakDataService
                .getOutbreaksList()
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback();
                        return throwError(err);
                    })
                )
                .subscribe((outbreaks: OutbreakModel[]) => {
                    // map outbreaks to id / model
                    const outbreaksMapped: {
                        [ id: string ]: OutbreakModel
                    } = _.transform(
                        outbreaks,
                        (result, outbreak: OutbreakModel) => {
                            result[outbreak.id] = outbreak;
                        },
                        {}
                    );

                    // retrieve usages of a location
                    this.locationDataService
                        .getLocationUsage(this.locationId)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                finishCallback();
                                return throwError(err);
                            })
                        )
                        .subscribe((locationUsage: LocationUsageModel) => {
                            // remove keys if we don't have rights
                            // #TODO - not sure if this is how it should be...

                            // follow-ups
                            if (!this.authUser.hasPermissions(PERMISSION.READ_FOLLOWUP)) {
                                locationUsage.followUp = [];
                            }

                            // events
                            if (!EventModel.canList(this.authUser)) {
                                locationUsage.event = [];
                            }

                            // contacts
                            if (!this.authUser.hasPermissions(PERMISSION.READ_CONTACT)) {
                                locationUsage.contact = [];
                            }

                            // cases
                            if (!this.authUser.hasPermissions(PERMISSION.READ_CASE)) {
                                locationUsage.case = [];
                            }

                            // create usage list
                            const usageData: UsageDetails = new UsageDetails(locationUsage, outbreaksMapped);
                            this.usageDetailsListMore = usageData.items.length > Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED ? {
                                displayed: Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED,
                                total: usageData.items.length
                            } : null;
                            this.usageDetailsList = usageData.items.slice(0, Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED);

                            // flag if list is empty
                            this.checkEmptyList(this.usageDetailsList);

                            // finished
                            finishCallback();
                        });
                });
        } else {
            finishCallback();
        }
    }

    /**
     * Check if we have write permissions for this item
     * @param item
     */
    hasWriteAccess(item: UsageDetailsItem): boolean {
        // check outbreak
        if (this.authUser.activeOutbreakId !== item.outbreakId) {
            return false;
        }

        // check permissions accordingly to type
        switch (item.type) {
            case UsageDetailsItemType.CASE:
                return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
            case UsageDetailsItemType.CONTACT:
                return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
            case UsageDetailsItemType.EVENT:
                return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
            case UsageDetailsItemType.FOLLOW_UP:
                return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
        }

        // something went wrong, if this part was reached
        return false;
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'type',
            'name',
            'outbreakName'
        ];
    }
}
