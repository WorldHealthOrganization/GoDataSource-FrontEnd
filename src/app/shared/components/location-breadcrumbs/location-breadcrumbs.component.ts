import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../breadcrumbs/breadcrumb-item.model';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../../core/models/hierarchical-location.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../core/models/location.model';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-location-breadcrumbs',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './location-breadcrumbs.component.html',
    styleUrls: ['./location-breadcrumbs.component.less']
})
export class LocationBreadcrumbsComponent implements OnInit {
    @Input() activeLocationBreadcrumb: string;

    locationData: LocationModel = new LocationModel();
    parentId: string;
    locationId: string;

    // location breadcrumbs
    public locationBreadcrumbs: BreadcrumbItemModel[] = [];

    constructor(
        private locationDataService: LocationDataService,
        private route: ActivatedRoute,
        private router: Router,
        private snackbarService: SnackbarService
    ) {}

    ngOnInit() {
        this.route.params
            .subscribe((params: { parentId, locationId }) => {
                // set parent
                this.parentId = params.parentId;

                // set location
                this.locationId = params.locationId;

                // refresh breadcrumbs
                this.refreshBreadcrumbs();
            });
    }

    refreshBreadcrumbs() {
        // reset breadcrumbs
        this.locationBreadcrumbs = [];

        // retrieve parents of this parent and create breadcrumbs if necessary
        if (this.parentId) {
            // retrieve parent locations
            this.locationDataService.getHierarchicalParentListOfLocation(this.parentId).subscribe((locationParents) => {
                this.addBreadcrumbs(locationParents);
            });
        } else {
            if (this.locationId) {
                this.locationDataService
                    .getLocation(this.locationId)
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showError(err.message);
                            this.router.navigate(['/locations']);
                            return throwError(err);
                        })
                    )
                    .subscribe((locationData) => {
                        // location data
                        this.locationData = new LocationModel(locationData);

                        // retrieve parent locations
                        if (this.locationData.parentLocationId) {
                            this.locationDataService.getHierarchicalParentListOfLocation(this.locationData.parentLocationId).subscribe((locationParents) => {
                                this.addBreadcrumbs(locationParents);
                            });
                        }
                    });
            }
        }
    }

    /**
     * Add breadcrumbs
     * @param locationParents
     */
    addBreadcrumbs(locationParents) {
        // add location
        this.locationBreadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_LOCATIONS_ALL_TITLE',
                '/locations'
            )
        );

        // add parent locations
        if (locationParents && locationParents.length > 0) {
            let locationP = locationParents[0];
            while (!_.isEmpty(locationP.location)) {
                // add breadcrumbs
                this.locationBreadcrumbs.push(
                    new BreadcrumbItemModel(
                        locationP.location.name,
                        `/locations/${locationP.location.id}/children`
                    )
                );
                locationP = _.isEmpty(locationP.children) ? {} as HierarchicalLocationModel : locationP.children[0];
            }
        }

        // add active breadcrumb
        if (this.activeLocationBreadcrumb) {
            this.locationBreadcrumbs.push(
                new BreadcrumbItemModel(
                    this.activeLocationBreadcrumb,
                    '.',
                    true,
                    {},
                    this.locationData
                )
            );
        } else {
            if (!_.isEmpty(this.locationBreadcrumbs)) {
                this.locationBreadcrumbs[this.locationBreadcrumbs.length - 1].active = true;
            }
        }
    }
}
