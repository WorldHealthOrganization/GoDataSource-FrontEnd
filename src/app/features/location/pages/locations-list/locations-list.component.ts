import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { Observable } from 'rxjs/Observable';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton } from '../../../../shared/components';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-locations-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './locations-list.component.html',
    styleUrls: ['./locations-list.component.less']
})
export class LocationsListComponent extends ListComponent implements OnInit {
    public breadcrumbs: BreadcrumbItemModel[] = [];

    locationsList$: Observable<LocationModel[]>;
    yesNoOptionsList$: Observable<any[]>;
    parentId: string;

    // authenticated user
    authUser: UserModel;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private locationDataService: LocationDataService,
        private genericDataService: GenericDataService,
        private route: ActivatedRoute,
        protected dialogService: DialogService,
        private snackbarService: SnackbarService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // lists
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // reload data
        this.route.params
            .subscribe((params: { parentId }) => {
                // set parent
                this.parentId = params.parentId;

                // reset breadcrumbs
                this.breadcrumbs = [
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_LOCATIONS_TITLE',
                        '/locations',
                        true
                    )
                ];

                // retrieve parents of this parent and create breadcrumbs if necessary
                if (this.parentId) {
                    // retrieve parent locations
                    this.locationDataService.getHierarchicalParentListOfLocation(this.parentId).subscribe((locationParents) => {
                        if (locationParents && locationParents.length > 0) {
                            let locationP = locationParents[0];
                            while (!_.isEmpty(locationP.location)) {
                                // make previous breadcrumb not the active one
                                this.breadcrumbs[this.breadcrumbs.length - 1].active = false;

                                // add breadcrumb
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        locationP.location.name,
                                        `/locations/${locationP.location.id}/children`,
                                        true
                                    )
                                );

                                // next location
                                locationP = _.isEmpty(locationP.children) ? {} as HierarchicalLocationModel : locationP.children[0];
                            }
                        }
                    });
                }

                // refresh list
                this.refreshList();
            });
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList() {
        // retrieve the list of Contacts
        this.locationsList$ = this.locationDataService.getLocationsListByParent(this.parentId, this.queryBuilder);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // default columns that we should display
        const columns = [
            'name',
            'synonyms',
            'active',
            'populationDensity',
            'actions'
        ];

        // finished
        return columns;
    }

    /**
     * Delete location
     */
    deleteLocation(location: LocationModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LOCATION', location)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete record
                    this.locationDataService
                        .deleteLocation(location.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.refreshList();
                        });
                }
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
