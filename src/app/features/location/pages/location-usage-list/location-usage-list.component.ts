import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationUsageModel, UsageDetails, UsageDetailsItem } from '../../../../core/models/location-usage.model';
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
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-location-usage-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './location-usage-list.component.html',
    styleUrls: ['./location-usage-list.component.less']
})
export class LocationUsageListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    locationId: string;
    locationData: LocationModel;

    usageDetailsList: UsageDetailsItem[];
    usageDetailsListMore: {
        displayed: number,
        total: number
    };

    fixedTableColumns: string[] = [
        'type',
        'name',
        'outbreakName'
    ];

    recordActions: HoverRowAction[] = [
        // View Item
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            click: (item: UsageDetailsItem) => {
                this.router.navigateByUrl(item.viewUrl);
            },
            visible: (item: UsageDetailsItem): boolean => {
                return item.typePermissions &&
                    item.typePermissions.canView(this.authUser);
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
                return item.typePermissions &&
                    item.typePermissions.canModify(this.authUser);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private locationDataService: LocationDataService,
        private outbreakDataService: OutbreakDataService,
        protected route: ActivatedRoute
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { locationId }) => {
            this.locationId = params.locationId;

            // retrieve location
            this.locationDataService
                .getLocation(this.locationId)
                .subscribe((location: LocationModel) => {
                    // location data
                    this.locationData = location;

                    // update breadcrumbs
                    this.initializeBreadcrumbs();

                    // get usage list
                    this.needsRefreshList(true);
                });
        });
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (LocationModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_LOCATIONS_TITLE', '/locations')
            );
        }

        // usage breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_USAGE_LOCATIONS_TITLE',
                '.',
                true,
                {},
                this.locationData
            )
        );
    }

    /**
     * Re(load) the list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.locationId) {
            // retrieve outbreaks
            this.outbreakDataService
                .getOutbreaksListReduced()
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
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
                                finishCallback([]);
                                return throwError(err);
                            })
                        )
                        .subscribe((locationUsage: LocationUsageModel) => {
                            // remove keys if we don't have rights
                            // #TODO - not sure if this is how it should be...

                            // follow-ups
                            if (!FollowUpModel.canList(this.authUser)) {
                                locationUsage.followUp = [];
                            }

                            // events
                            if (!EventModel.canList(this.authUser)) {
                                locationUsage.event = [];
                            }

                            // contacts
                            if (!ContactModel.canList(this.authUser)) {
                                locationUsage.contact = [];
                            }

                            // cases
                            if (!CaseModel.canList(this.authUser)) {
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
                            finishCallback(this.usageDetailsList);
                        });
                });
        } else {
            finishCallback([]);
        }
    }
}
