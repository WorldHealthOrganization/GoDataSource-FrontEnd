import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
import { UserModel } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';

import * as _ from 'lodash';
import { OutbreakDialogComponent } from '../../components/outbreak-dialog/outbreak-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '.', true)
    ];

    // list of existing outbreaks
    outbreaksList$: Observable<OutbreakModel[]>;
    activeOptionsList$: Observable<any[]>;
    outbreaksListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    authUser: UserModel;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private dialog: MatDialog,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService
    ) {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.activeOptionsList$ = this.genericDataService.getActiveOptions();
        this.loadOutbreaksList();
    }

    /**
     * Load the list of outbreaks
     */
    loadOutbreaksList() {
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList(this.outbreaksListQueryBuilder);
    }

    /**
     * Delete an outbreak instance
     * @param outbreak
     */
    delete(outbreak) {
        if (confirm(`Are you sure you want to delete the outbreak ${outbreak.name}?`)) {
            // find users with this outbreak set as active and display them:
            const outbreakUsersListQueryBuilder = new RequestQueryBuilder();
            outbreakUsersListQueryBuilder.where({
                'activeOutbreakId': {
                    'eq': `${outbreak.id}`
                }
            });

            this.userDataService.getUsersList(outbreakUsersListQueryBuilder)
                .subscribe((users) => {
                    // check users.length > 1 as it needs to be active for the user that will delete it.
                    if (users.length <= 1) {
                        this.outbreakDataService
                            .deleteOutbreak(outbreak.id)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);
                                return ErrorObservable.create(err);
                            })
                            .subscribe(response => {
                                // reload user data to get the updated data regarding active outbreak
                                this.authDataService
                                    .reloadAndPersistAuthUser()
                                    .subscribe((authenticatedUser) => {
                                        this.authUser = authenticatedUser.user;
                                        this.snackbarService.showSuccess('Success');
                                        this.loadOutbreaksList();
                                    });

                            });
                    } else {
                        this.dialog.open(OutbreakDialogComponent, {
                            data: {users: users}
                        });
                    }

                });
        }
    }

    setActive(outbreak) {
        if (confirm('Are you sure you want to set this outbreak active ? \nThe other active outbreak will be deactivated.')) {
            let userData = {'activeOutbreakId': outbreak.id};
            var userId = this.authUser.id;
            this.userDataService
                .modifyUser(userId, userData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(response => {
                    // reload user data to save the new active outbreak
                    this.authDataService
                        .reloadAndPersistAuthUser()
                        .subscribe((authenticatedUser) => {
                            this.authUser = authenticatedUser.user;
                            this.snackbarService.showSuccess('Active outbreak changed successfully');
                            this.outbreakDataService.checkActiveSelectedOutbreak();
                            this.loadOutbreaksList();
                        });
                });
        }
    }

    /**
     * Filter the Outbreaks list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        if (_.isEmpty(value)) {
            this.outbreaksListQueryBuilder.whereRemove(property);
        } else {
            switch (property) {
                case 'active':
                    switch (value.value) {
                        case '' : {
                            this.outbreaksListQueryBuilder.whereRemove('id');
                            break;
                        }
                        case true : {
                            this.outbreaksListQueryBuilder.where({
                                id: {
                                    'eq': this.authUser.activeOutbreakId
                                }
                            });
                            break;
                        }
                        case false : {
                            this.outbreaksListQueryBuilder.where({
                                id: {
                                    'neq': this.authUser.activeOutbreakId
                                }
                            });
                            break;
                        }
                    }
                    break;
                default:
                    this.outbreaksListQueryBuilder.where({
                        [property]: {
                            regexp: `/^${value}/i`
                        }
                    });
            }
        }
        this.loadOutbreaksList();
    }

    /**
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

}
