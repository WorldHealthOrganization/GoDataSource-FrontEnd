import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';

@Component({
    selector: 'app-create-location',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-location.component.html',
    styleUrls: ['./create-location.component.less']
})
export class CreateLocationComponent implements OnInit {

    public breadcrumbs: BreadcrumbItemModel[] = [];

    locationData: LocationModel = new LocationModel();

    parentId: string;

    constructor(
        private router: Router,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private route: ActivatedRoute,
        private formHelper: FormHelperService
    ) {}

    ngOnInit() {
        // reload data
        this.route.params
            .subscribe((params: { parentId }) => {
                // set parent
                this.parentId = params.parentId;

                // reset breadcrumbs
                this.breadcrumbs = [
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_LOCATIONS_TITLE',
                        '/locations'
                    )
                ];

                // retrieve parents of this parent and create breadcrumbs if necessary
                if (this.parentId) {
                    // retrieve parent locations
                    this.locationDataService.getHierarchicalParentListOfLocation(this.parentId).subscribe((locationParents) => {
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
                                'LNG_PAGE_CREATE_LOCATION_TITLE',
                                '.',
                                true
                            )
                        );
                    });
                } else {
                    // add create
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(
                            'LNG_PAGE_CREATE_LOCATION_TITLE',
                            '.',
                            true
                        )
                    );
                }
            });
    }

    /**
     * Create Location
     * @param {NgForm[]} stepForms
     */
    createNewLocation(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // set parent location
        if (this.parentId) {
            dirtyFields.parentLocationId = this.parentId;
        }

        // create record
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Location
            this.locationDataService
                .createLocation(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_LOCATION_ACTION_CREATE_LOCATION_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.router.navigate(this.parentId ? ['/locations', this.parentId, 'children'] : ['/locations']);
                });
        }
    }
}