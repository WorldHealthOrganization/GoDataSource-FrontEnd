import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Component({
    selector: 'app-modify-location',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-location.component.html',
    styleUrls: ['./modify-location.component.less']
})
export class ModifyLocationComponent extends ViewModifyComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] =  [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LOCATIONS_TITLE',
            '/locations'
        )
    ];
    // locations breadcrumbs
    public locationBreadcrumbs: BreadcrumbItemModel[] = [];

    locationId: string;
    locationData: LocationModel = new LocationModel();
    authUser: UserModel;

    geographicalLevelsList$: Observable<any>;

    backToCurrent: boolean = false;

    constructor(
        private locationDataService: LocationDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);

        this.route.queryParams
            .subscribe((params: { backToCurrent }) => {
                this.backToCurrent = params.backToCurrent;
            });

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
                this.locationBreadcrumbs = [];
            });

        if (this.locationId) {
            this.locationDataService
                .getLocation(this.locationId)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    this.disableDirtyConfirm();
                    this.router.navigate(['/locations']);
                    return ErrorObservable.create(err);
                })
                .subscribe((locationData: {}) => {
                    // location data
                    this.locationData = new LocationModel(locationData);
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(
                             this.viewOnly ? 'LNG_PAGE_VIEW_LOCATION_TITLE' : 'LNG_PAGE_MODIFY_LOCATION_TITLE',
                            '.',
                            true,
                            {},
                            this.locationData
                        )
                    );
                });
        }
    }

    modifyLocation(form: NgForm) {
        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // even if we set value to float, some browser might get it as a string sicne we use form for this...
        // so..we need to force again the geo location to have numbers
        const lat: number | string = _.get(dirtyFields, 'geoLocation.lat');
        if (
            !_.isNumber(lat) &&
            !_.isEmpty(lat)
        ) {
            _.set(dirtyFields, 'geoLocation.lat', parseFloat(lat as string));
        }
        const lng: number | string = _.get(dirtyFields, 'geoLocation.lng');
        if (
            !_.isNumber(lng) &&
            !_.isEmpty(lng)
        ) {
            _.set(dirtyFields, 'geoLocation.lng', parseFloat(lng as string));
        }

        // check if we nee to remove geo Location
        if (
            dirtyFields.geoLocation !== undefined &&
            dirtyFields.geoLocation.lat === undefined &&
            dirtyFields.geoLocation.lng === undefined
        ) {
            // on update we need to send it to remove the previous values
            dirtyFields.geoLocation = null;
        }

        // validate
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
                this.disableDirtyConfirm();
                this.router.navigate(
                    dirtyFields.parentLocationId ?
                        ['/locations', dirtyFields.parentLocationId, 'children'] :
                        ['/locations'])
                ;
            });
    }

    /**
     * Check if we have write access to locations
     * @returns {boolean}
     */
    hasLocationWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Update Lat Lng
     * @param property
     * @param data
     */
    onChangeLatLng(
        property: string,
        value
    ) {
        _.set(
            this.locationData,
            `geoLocation.${property}`,
            value ? parseFloat(value) : undefined
        );
    }

    /**
     * Check if lat & lng are required
     */
    isLatLngRequired(value: any) {
        return _.isString(value) ?
            value.length > 0 : (
                value || value === 0
            );
    }
}
