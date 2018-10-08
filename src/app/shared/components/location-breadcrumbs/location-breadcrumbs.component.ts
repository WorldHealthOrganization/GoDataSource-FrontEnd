import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../breadcrumbs/breadcrumb-item.model';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../../core/models/hierarchical-location.model';
import { ListComponent } from '../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../core/models/location.model';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-location-breadcrumbs',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './location-breadcrumbs.component.html',
    styleUrls: ['./location-breadcrumbs.component.less']
})
export class LocationBreadcrumbsComponent extends ListComponent implements OnInit {

    locationsList$: Observable<LocationModel[]>;
    locationData: LocationModel = new LocationModel();
    parentId: string;
    locationId: string;

    // location breadcrumbs
    public locationBreadcrumbs: BreadcrumbItemModel[] = [];

    constructor(
        private locationDataService: LocationDataService,
        private route: ActivatedRoute,
        private router: Router,
        protected snackbarService: SnackbarService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        this.route.params
            .subscribe((params: { parentId, locationId }) => {
                    // set parent
                    this.parentId = params.parentId;
                    // set location
                    this.locationId = params.locationId;
                    // reset breadcrumbs
                    this.locationBreadcrumbs = [];
                    // get url for manipulating create location page
                    const url = window.location.pathname;

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
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);
                                    this.router.navigate(['/locations']);
                                    return ErrorObservable.create(err);
                                })
                                .subscribe((locationData: {}) => {
                                    // location data
                                    this.locationData = new LocationModel(locationData);

                                    // retrieve parent locations
                                    if (this.locationData.parentLocationId) {
                                        this.locationDataService.getHierarchicalParentListOfLocation(this.locationData.parentLocationId).subscribe((locationParents) => {
                                            this.addBreadcrumbs(locationParents);
                                            // add create
                                            this.locationBreadcrumbs.push(
                                                new BreadcrumbItemModel(
                                                    'LNG_PAGE_MODIFY_LOCATION_NAME',
                                                    '.',
                                                    true,
                                                    {},
                                                    this.locationData
                                                )
                                            );
                                        });
                                    } else {
                                        // add modify
                                        this.locationBreadcrumbs.push(
                                            new BreadcrumbItemModel(
                                                'LNG_PAGE_MODIFY_LOCATION_TITLE',
                                                '.',
                                                true,
                                                {},
                                                this.locationData
                                            )
                                        );
                                    }
                                });
                        }
                    }
                }
            );
    }

    /**
     * Add breadcrumbs
     * @param locationParents
     */
    addBreadcrumbs(locationParents) {
        if (locationParents && locationParents.length > 0) {
            let locationP = locationParents[0];
            while (!_.isEmpty(locationP.location)) {
                if ( this.locationBreadcrumbs.length) {
                    this.locationBreadcrumbs[this.locationBreadcrumbs.length - 1].active = false;
                }
                // add breadcrumbs
                this.locationBreadcrumbs.push(
                    new BreadcrumbItemModel(
                        locationP.location.name,
                        `/locations/${locationP.location.id}/children`,
                        true
                    )
                );
                locationP = _.isEmpty(locationP.children) ? {} as HierarchicalLocationModel : locationP.children[0];
            }
        }
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList() {
        // retrieve the list of Contacts
        this.locationsList$ = this.locationDataService.getLocationsListByParent(this.parentId, this.queryBuilder);
    }
}
