import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { PERMISSION } from '../../../../core/models/permission.model';

import * as _ from 'lodash';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '.', true)
    ];

    // import constants into template
    Constants = Constants;

    // list of existing outbreaks
    outbreaksList$: Observable<OutbreakModel[]>;
    // list of options from the Active dropdown
    activeOptionsList$: Observable<any[]>;
    // list of diseases
    diseasesList$: Observable<any[]>;
    // authenticated user
    authUser: UserModel;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        super();

    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.activeOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.diseasesList$ = this.genericDataService.getDiseasesList();
        this.refreshList();
    }
    /**
     * Re(load) the Outbreaks list
     */
    refreshList() {
       // retrieve the list of Outbreaks
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList(this.queryBuilder);

    }

    /**
     * Delete an outbreak instance
     * @param outbreak
     */
    delete(outbreak) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_OUTBREAK', outbreak)
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {

                    this.outbreakDataService
                        .deleteOutbreak(outbreak.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // reload user data to get the updated data regarding active outbreak
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe((authenticatedUser) => {
                                    this.authUser = authenticatedUser.user;
                                });
                            this.snackbarService.showSuccess('Success');
                            this.refreshList();
                        });
                }
            });
    }

    setActive(outbreak) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_MAKE_OUTBREAK_ACTIVE')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    const userData = {'activeOutbreakId': outbreak.id};
                    const userId = this.authUser.id;
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
                                    this.refreshList();
                                });
                        });
                }
            });
    }

    /**
     * Filters the outbreaks by Active property
     * @param {string} property
     * @param value
     */
    filterByActiveOutbreak(property: string, value: any) {
        // check if value is boolean. If not, remove filter
        if (!_.isBoolean(value.value)) {
            // remove filter
            this.queryBuilder.filter.remove(property);
        } else {
            switch (value.value) {
                case true : {
                    this.queryBuilder.filter.where({
                        id: {
                            'eq': this.authUser.activeOutbreakId
                        }
                    });
                    break;
                }
                case false : {
                    this.queryBuilder.filter.where({
                        id: {
                            'neq': this.authUser.activeOutbreakId
                        }
                    });
                    break;
                }
            }
        }
        // refresh list
        this.refreshList();
    }

    /**
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

}
