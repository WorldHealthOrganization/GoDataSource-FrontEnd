import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from "../../../../core/services/data/outbreak.data.service";
import { UserDataService } from "../../../../core/services/data/user.data.service";
import { AuthDataService } from "../../../../core/services/data/auth.data.service";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { Observable } from "rxjs/Observable";
import { OutbreakModel } from "../../../../core/models/outbreak.model";
import { RequestQueryBuilder } from "../../../../core/services/helper/request-query-builder";
import { UserModel } from "../../../../core/models/user.model";

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
    outbreaksListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
    authUser: UserModel;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService
    ) {
        this.authUser = this.authDataService.getAuthenticatedUser();
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
        if (confirm('Are you sure you want to delete ' + outbreak.name + ' ?')) {
            // make outbreak inactive
            let userData = {'activeOutbreakId': ''};
            var userId = this.authUser.id;
            this.userDataService
                .modifyUser(userId, userData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(response => {
                    this.outbreakDataService
                        .deleteOutbreak(outbreak.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(response => {
                            this.snackbarService.showSuccess('Success');
                            this.loadOutbreaksList();
                        });
                });

        }
    }

    setActive(outbreak){
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
        this.outbreaksListQueryBuilder.where({
            [property]: {
                regexp: `/^${value}/i`
            }
        });
        this.loadOutbreaksList();
    }

    /**
     * Filter the Outbreaks list by some field
     * @param property
     * @param value
     */
    filterActiveBy(property, option) {
        switch (option.value) {
            case 'all' : {
                this.outbreaksListQueryBuilder.where({
                    ['id']: {
                        'like': `-`
                    }
                });
                break;
            }
            case true : {
                this.outbreaksListQueryBuilder.where({
                    ['id']: {
                        'eq': this.authUser.activeOutbreakId
                    }
                });
                break;
            }
            case false : {
                this.outbreaksListQueryBuilder.where({
                    ['id']: {
                        'neq': this.authUser.activeOutbreakId
                    }
                });
                break;
            }
        }
        this.loadOutbreaksList();
    }

}
