import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm, NgModel } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { LocationBreadcrumbsComponent } from '../../../../shared/components/location-breadcrumbs/location-breadcrumbs.component';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-modify-location',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-location.component.html',
    styleUrls: ['./modify-location.component.less']
})
export class ModifyLocationComponent extends ViewModifyComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    LocationModel = LocationModel;

    locationId: string;
    locationData: LocationModel = new LocationModel();
    authUser: UserModel;

    geographicalLevelsList$: Observable<any>;

    backToCurrent: boolean = false;

    // exclude locations
    excludeLocations: string[];

    @ViewChild('locationBreadcrumbs', { static: true }) locationBreadcrumbs: LocationBreadcrumbsComponent;
    @ViewChild('latInput', { static: true }) latInput: NgModel;
    @ViewChild('lngInput', { static: true }) lngInput: NgModel;

    /**
     * Constructor
     */
    constructor(
        private locationDataService: LocationDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);

        this.route.queryParams
            .subscribe((params: { backToCurrent }) => {
                this.backToCurrent = params.backToCurrent;
            });

        // show loading
        this.showLoadingDialog(false);

        this.route.params
            .subscribe((params: { locationId }) => {
                this.locationId = params.locationId;

                this.locationDataService
                    .getLocation(this.locationId, true)
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showApiError(err);
                            this.disableDirtyConfirm();
                            this.router.navigate(['/locations']);

                            return throwError(err);
                        })
                    )
                    .subscribe((locationData: {}) => {
                        // location data
                        this.locationData = new LocationModel(locationData);
                        this.updateLocationsForExclusion();

                        // update breadcrumbs
                        this.initializeBreadcrumbs();

                        // hide loading
                        this.hideLoadingDialog();
                    });
            });
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

        // view / modify breadcrumb
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

    /**
     * Modify location
     */
    modifyLocation(form: NgForm) {
        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // even if we set value to float, some browser might get it as a string since we use form for this...
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

        // show loading
        this.showLoadingDialog();

        this.locationDataService
            .modifyLocation(
                this.locationId,
                dirtyFields,
                true
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((modifiedLocation: LocationModel) => {
                // update model
                this.locationData = modifiedLocation;
                this.updateLocationsForExclusion();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LOCATION_ACTION_MODIFY_LOCATION_SUCCESS_MESSAGE');

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // refresh location breadcrumbs
                this.locationBreadcrumbs.refreshBreadcrumbs();
                if (
                    dirtyFields.geoLocation &&
                    LocationModel.canPropagateGeoToPersons(this.authUser)
                ) {
                    this.locationDataService
                        .getLocationUsageCount(modifiedLocation.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                // hide loading
                                this.hideLoadingDialog();
                                return throwError(err);
                            })
                        )
                        .subscribe((usedEntitiesCount) => {
                            if (usedEntitiesCount.count > 0) {
                                this.dialogService
                                    .showConfirm(new DialogConfiguration({
                                        message: 'LNG_DIALOG_CONFIRM_PROPAGATE_LAT_LNG',
                                        cancelLabel: 'LNG_COMMON_LABEL_NO'
                                    }))
                                    .subscribe((answer: DialogAnswer) => {
                                        if (answer.button === DialogAnswerButton.Yes) {
                                            // propagate values to all the entities that have in use this location
                                            this.locationDataService
                                                .propagateGeoLocation(modifiedLocation.id)
                                                .pipe(
                                                    catchError((err) => {
                                                        this.snackbarService.showApiError(err);
                                                        // hide loading
                                                        this.hideLoadingDialog();
                                                        return throwError(err);
                                                    })
                                                )
                                                .subscribe(() => {
                                                    // hide loading
                                                    this.hideLoadingDialog();

                                                    // success msg
                                                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LOCATION_ACTION_PROPAGATE_LOCATION_GEO_LOCATION_SUCCESS_MESSAGE');
                                                });
                                        } else {
                                            // hide loading
                                            this.hideLoadingDialog();
                                        }
                                    });
                            } else {
                                // hide loading
                                this.hideLoadingDialog();
                            }
                        });
                } else {
                    // hide loading
                    this.hideLoadingDialog();
                }
            });
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
        this.latInput.control.markAsDirty();
        this.lngInput.control.markAsDirty();
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

    /**
     * Update locations used for exclusion
     */
    updateLocationsForExclusion(): void {
        this.excludeLocations = this.locationData ?
            [this.locationData.id] :
            undefined;
    }
}
