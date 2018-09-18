import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationUsageModel, UsageDetails, UsageDetailsItem, UsageDetailsItemType } from '../../../../core/models/location-usage.model';
import { LocationModel } from '../../../../core/models/location.model';

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

    constructor(
        private authDataService: AuthDataService,
        private locationDataService: LocationDataService,
        protected route: ActivatedRoute
    ) {
        super();
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
                    this.refreshList();
                });
        });
    }

    /**
     * Re(load) the list
     */
    refreshList() {
        if (this.locationId) {
            // retrieve usages of a location
            this.locationDataService
                .getLocationUsage(this.locationId)
                .subscribe((locationUsage: LocationUsageModel) => {
                    // remove keys if we don't have rights
                    // #TODO - not sure if this is how it should be...

                    // follow-ups
                    if (!this.authUser.hasPermissions(PERMISSION.READ_FOLLOWUP)) {
                        locationUsage.followUp = [];
                    }

                    // events
                    if (!this.authUser.hasPermissions(PERMISSION.READ_EVENT)) {
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

                    // create ussage list
                    this.usageDetailsList = new UsageDetails(locationUsage).items;
                });
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
            'actions'
        ];
    }
}
