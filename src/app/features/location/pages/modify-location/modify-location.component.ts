import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { LocationBreadcrumbsComponent } from '../../../../shared/components/location-breadcrumbs/location-breadcrumbs.component';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';

@Component({
    selector: 'app-modify-location',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-location.component.html',
    styleUrls: ['./modify-location.component.less']
})
export class ModifyLocationComponent extends ViewModifyComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] =  [];

    locationId: string;
    locationData: LocationModel = new LocationModel();
    authUser: UserModel;

    geographicalLevelsList$: Observable<any>;

    backToCurrent: boolean = false;

    @ViewChild('locationBreadcrumbs') locationBreadcrumbs: LocationBreadcrumbsComponent;

    constructor(
        private locationDataService: LocationDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
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
                        this.createBreadcrumbs();
                    });
            });
    }

    modifyLocation(form: NgForm) {
        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // even if we set value to float, some browser might get it as a string since we use form for this...
        // so..we need to force again the geo location to have numbers
        const lat: number | string = _.get(dirtyFields, 'geoLocation.lat');
        if (
            (
                !_.isNumber(lat) &&
                !_.isEmpty(lat)
            ) ||
            _.isUndefined(lat)
        ) {
            _.set(dirtyFields, 'geoLocation.lat', parseFloat(lat as string));
        }
        const lng: number | string = _.get(dirtyFields, 'geoLocation.lng');
        if (
            (
                !_.isNumber(lng) &&
                !_.isEmpty(lng)
            ) ||
            _.isUndefined(lng)
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

        const loadingDialog = this.dialogService.showLoadingDialog();
        this.locationDataService
            .modifyLocation(this.locationId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedLocation: LocationModel) => {
                // update model
                this.locationData = modifiedLocation;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LOCATION_ACTION_MODIFY_LOCATION_SUCCESS_MESSAGE');

                // update breadcrumb
                this.createBreadcrumbs();

                // refresh location breadcrumbs
                this.locationBreadcrumbs.refreshBreadcrumbs();
                if (dirtyFields.geoLocation) {
                    this.locationDataService.getLocationUsageCount(modifiedLocation.id)
                        .subscribe((usedEntitiesCount) => {
                            if (usedEntitiesCount.count > 0) {
                                this.dialogService.showConfirm(new DialogConfiguration({
                                    message: 'LNG_DIALOG_CONFIRM_PROPAGATE_LAT_LNG',
                                    cancelLabel: 'LNG_COMMON_LABEL_NO'
                                })).subscribe((answer: DialogAnswer) => {
                                    if (answer.button === DialogAnswerButton.Yes) {
                                        // propagate values to all the entities that have in use this location
                                        this.locationDataService.propagateGeoLocation(modifiedLocation.id)
                                            .catch((err) => {
                                                this.snackbarService.showApiError(err);
                                                return ErrorObservable.create(err);
                                            }).subscribe(() => {
                                                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LOCATION_ACTION_PROPAGATE_LOCATION_GEO_LOCATION_SUCCESS_MESSAGE');
                                        });
                                    }
                                });
                            }
                        });
                }

                // hide dialog
                loadingDialog.close();
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

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_LOCATIONS_TITLE',
                '/locations'
            ),

            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_LOCATION_TITLE' : 'LNG_PAGE_MODIFY_LOCATION_TITLE',
                '.',
                true,
                {},
                this.locationData
            )
        ];
    }
}
