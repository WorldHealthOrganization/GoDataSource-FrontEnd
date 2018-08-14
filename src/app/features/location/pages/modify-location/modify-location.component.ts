import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';

@Component({
    selector: 'app-modify-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-location.component.html',
    styleUrls: ['./modify-location.component.less']
})
export class ModifyLocationComponent extends  ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    locationId: string;
    locationData: LocationModel = new LocationModel();

    constructor(
        private locationDataService: LocationDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute
    ) {
        super(route);
    }

    ngOnInit() {
        this.route.params
            .subscribe((params: { locationId }) => {
                this.locationId = params.locationId;

                // reset breadcrumbs
                this.breadcrumbs = [
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_LOCATIONS_TITLE',
                        '/locations'
                    )
                ];

                // retrieve location
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
                                if (locationParents && locationParents.length > 0) {
                                    let locationP = locationParents[0];
                                    while (!_.isEmpty(locationP.location)) {
                                        // add breadcrumb
                                        this.breadcrumbs.push(
                                            new BreadcrumbItemModel(
                                                locationP.location.name,
                                                `/locations/${locationP.location.id}/children`
                                            )
                                        );

                                        // next location
                                        locationP = _.isEmpty(locationP.children) ? {} as HierarchicalLocationModel : locationP.children[0];
                                    }
                                }

                                // add create
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_MODIFY_LOCATION_TITLE',
                                        '.',
                                        true,
                                        {},
                                        this.locationData
                                    )
                                );
                            });
                        } else {
                            // add modify
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    this.viewOnly ? 'LNG_PAGE_VIEW_LOCATION_TITLE' : 'LNG_PAGE_MODIFY_LOCATION_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.locationData
                                )
                            );
                        }
                    });
            });
    }

    modifyLocation(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        this.locationDataService
            .modifyLocation(this.locationId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LOCATION_ACTION_MODIFY_LOCATION_SUCCESS_MESSAGE');

                // navigate to listing page
                this.router.navigate(
                    this.locationData.parentLocationId ?
                        ['/locations', this.locationData.parentLocationId, 'children'] :
                        ['/locations'])
                ;
            });
    }
}
