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

    parentId: string;

    constructor(
        private router: Router,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private route: ActivatedRoute,
        private formHelper: FormHelperService
    ) {
        super();
    }

    ngOnInit() {
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
                    this.disableDirtyConfirm();
                    this.router.navigate(this.parentId ? ['/locations', this.parentId, 'children'] : ['/locations']);
                });
        }
    }
}
