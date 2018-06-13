import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.less']
})
export class CasesListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Cases', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing cases
    casesList$: Observable<CaseModel[]>;
    casesListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    caseClassificationsList$: Observable<any[]>;

    constructor(
        private caseDataService: CaseDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.caseClassificationsList$ = this.genericDataService.getCaseClassificationsList();

        this.loadCasesList();
    }

    /**
     * Re(load) the Cases list
     */
    loadCasesList() {
        // get current outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((currentOutbreak: OutbreakModel) => {
                // get the list of existing cases
                this.casesList$ = this.caseDataService.getCasesList(currentOutbreak.id, this.casesListQueryBuilder);
            });
    }

    /**
     * Filter the Cases list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // filter by any User property
        this.casesListQueryBuilder.where({
            [property]: {
                regexp: `/^${value}/i`
            }
        });

        // refresh users list
        this.loadCasesList();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'classification', 'age', 'gender', 'dateOfOnset'];

        // check if the authenticated user has WRITE access
        if (this.authUser.hasPermissions(PERMISSION.WRITE_CASE)) {
            columns.push('actions');
        }

        return columns;
    }

}
