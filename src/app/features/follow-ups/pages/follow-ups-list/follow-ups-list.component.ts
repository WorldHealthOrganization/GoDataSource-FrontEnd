import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs/Observable';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Constants } from '../../../../core/models/constants';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationModel } from '../../../../core/models/location.model';

@Component({
    selector: 'app-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './follow-ups-list.component.html',
    styleUrls: ['./follow-ups-list.component.less']
})
export class FollowUpsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Follow-ups', '.', true)
    ];

    // import constants into template
    constants = Constants;

    // authenticated user
    authUser: UserModel;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        private snackbarService: SnackbarService,
        private locationDataService: LocationDataService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.refreshList();
            });
    }

    refreshList() {
        if (this.selectedOutbreak) {
            // make sure we request contact as well
            this.queryBuilder.include('contact');

            // retrieve locations
            this.locationDataService
                .getLocationsList()
                .subscribe((locations) => {
                    // map names to id
                    const locationsMapped = _.transform(locations, (result, location: LocationModel) => {
                        result[location.id] = location;
                    });

                    // display only unresolved followups
                    this.queryBuilder.filter.where({
                        performed: {
                            'eq': false
                        }
                    });

                    // retrieve the list of Follow Ups
                    this.followUpsList$ = this.followUpsDataService
                        .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
                        .map((followUps) => {
                            return _.map(followUps, (followUp: FollowUpModel) => {
                                // map location
                                if (
                                    followUp.address &&
                                    followUp.address.locationId
                                ) {
                                    followUp.address.location = locationsMapped[followUp.address.locationId];
                                }

                                // finished
                                return followUp;
                            });
                        });
                });
        }
    }

    /**
     * Check if we have access to create / generate follow-ups
     * @returns {boolean}
     */
    hasFollowUpsWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // default visible columns
        const columns = [
            'firstName',
            'lastName',
            'date',
            'area',
            'fullAddress'
        ];

        // check if the authenticated user has WRITE access
        // if (this.hasFollowUpsWriteAccess()) {
        //     columns.push('actions');
        // }

        // return columns that should be visible
        return columns;
    }

    /**
     * Generate Follow Ups
     */
    generateFollowUps() {
        if (this.selectedOutbreak) {
            this.followUpsDataService
                .generateFollowUps(this.selectedOutbreak.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe((data) => {
                    this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_TOAST_GENERATED');

                    // reload data
                    this.refreshList();
                });
        }
    }
}
