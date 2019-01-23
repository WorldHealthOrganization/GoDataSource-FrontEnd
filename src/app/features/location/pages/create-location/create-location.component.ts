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
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable } from 'rxjs/Observable';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { directive } from '@angular/core/src/render3/instructions';

@Component({
    selector: 'app-create-location',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-location.component.html',
    styleUrls: ['./create-location.component.less']
})
export class CreateLocationComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LOCATIONS_TITLE',
            '/locations'
        )
    ];
    locationData: LocationModel = new LocationModel();

    geographicalLevelsList$: Observable<any>;

    parentId: string;

    constructor(
        private router: Router,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private route: ActivatedRoute,
        private formHelper: FormHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {

        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);

        // reload data
        this.route.params
            .subscribe((params: { parentId }) => {
                // set parent
                this.parentId = params.parentId;

                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        'LNG_PAGE_CREATE_LOCATION_TITLE',
                        '.',
                        true
                    )
                );
            });
    }

    /**
     * Create Location
     * @param {NgForm[]} stepForms
     */
    createNewLocation(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

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
            // on create we don't need to send it
            delete dirtyFields.geoLocation;
        }

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
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.locationDataService
                .createLocation(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
                .subscribe((newLocation: LocationModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_LOCATION_ACTION_CREATE_LOCATION_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/locations/${newLocation.id}/modify`]);
                });
        }
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
