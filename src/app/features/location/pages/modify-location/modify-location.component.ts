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

    backToCurrent: boolean = false;

    constructor(
        private locationDataService: LocationDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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
                            'LNG_PAGE_MODIFY_LOCATION_TITLE',
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
                this.disableDirtyConfirm();
                this.router.navigate(
                    this.locationData.parentLocationId ?
                        ['/locations', this.locationData.parentLocationId, 'children'] :
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
}
