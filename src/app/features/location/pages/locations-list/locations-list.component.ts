import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import { LocationModel } from '../../../../core/models/location.model';
import { Observable } from 'rxjs/Observable';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton } from '../../../../shared/components';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { ErrorCodes } from '../../../../core/enums/error-codes.enum';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-locations-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './locations-list.component.html',
    styleUrls: ['./locations-list.component.less']
})
export class LocationsListComponent extends ListComponent implements OnInit {
    // breadcrumb header
    public breadcrumbs: BreadcrumbItemModel[] =  [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LOCATIONS_TITLE',
            '/locations'
        )
    ];

    // parent location ID
    parentId: string;

    // list of existing locations
    locationsList: LocationModel[];
    locationsListCount$: Observable<any>;

    yesNoOptionsList$: Observable<any[]>;

    // authenticated user
    authUser: UserModel;

    // export
    hierarchicalLocationsDataExportFileName: string = moment().format('YYYY-MM-DD');
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.JSON
    ];

    constructor(
        private authDataService: AuthDataService,
        private locationDataService: LocationDataService,
        private genericDataService: GenericDataService,
        private route: ActivatedRoute,
        private dialogService: DialogService,
        protected snackbarService: SnackbarService,
        private router: Router,
        private i18nService: I18nService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // add page title
        this.hierarchicalLocationsDataExportFileName = `${this.i18nService.instant('LNG_PAGE_LIST_LOCATIONS_TITLE')} - ${this.hierarchicalLocationsDataExportFileName}`;

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // lists
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // reload data
        this.route.params
            .subscribe((params: { parentId }) => {
                // set parent
                this.parentId = params.parentId;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when parent location is changed
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) the list of Locations
     */
    refreshList() {
        // retrieve the list of Locations
        this.locationsList = null;
        this.locationDataService.getLocationsListByParent(this.parentId, this.queryBuilder).subscribe((locationsList) => {
            this.locationsList = locationsList;
        });
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        this.locationsListCount$ = this.locationDataService.getLocationsCountByParent(this.parentId, countQueryBuilder);
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
            'latLng',
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
                        .catch((err: {
                            message: string,
                            code: ErrorCodes,
                            details: {
                                id: string,
                                model: string
                            }
                        }) => {
                            // check if we have a model in use error
                            if (err.code === ErrorCodes.MODEL_IN_USE) {
                                this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_LOCATION_USED', location)
                                    .subscribe((answerC: DialogAnswer) => {
                                        if (answerC.button === DialogAnswerButton.Yes) {
                                            // redirect to usage page where we can make changes
                                            this.router.navigate(['/locations', err.details.id, 'usage']);
                                        }
                                    });
                            } else if (err.code === ErrorCodes.DELETE_PARENT_MODEL) {
                                this.snackbarService.showError('LNG_DIALOG_CONFIRM_LOCATION_HAS_CHILDREN', location);
                            } else {
                                this.snackbarService.showError(err.message);
                            }

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
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
