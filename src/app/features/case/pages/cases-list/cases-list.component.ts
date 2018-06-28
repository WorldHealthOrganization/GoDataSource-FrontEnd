import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
export class CasesListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Cases', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of existing cases
    casesList$: Observable<CaseModel[]>;
    casesListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    caseClassificationsList$: Observable<any[]>;

    // gender list
    genderList$: Observable<any[]>;

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
    }

    ngOnInit() {
        // retrieve gender list
        this.genderList$ = this.genericDataService.getGendersList();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.loadCasesList();
            });
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    loadCasesList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Cases
            this.casesList$ = this.caseDataService.getCasesList(this.selectedOutbreak.id, this.casesListQueryBuilder);
        }
    }

    /**
     * Filter the Cases list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // clear filter ?
        if (_.isEmpty(value)) {
            this.casesListQueryBuilder.whereRemove(property);
        } else {
            // filter by any property
            switch (property) {
                case 'age':
                    if (_.isEmpty(value.from) && _.isEmpty(value.to)) {
                        this.casesListQueryBuilder.whereRemove(property);
                    } else {
                        // determine operator & value
                        let operator;
                        let valueToCompare;
                        if (!_.isEmpty(value.from) && !_.isEmpty(value.to)) {
                            operator = 'between';
                            valueToCompare = [value.from, value.to];
                        } else if (!_.isEmpty(value.from)) {
                            operator = 'gte';
                            valueToCompare = value.from;
                        } else {
                            operator = 'lte';
                            valueToCompare = value.to;
                        }

                        // filter
                        this.casesListQueryBuilder.where({
                            [property]: {
                                [operator]: valueToCompare
                            }
                        });
                    }
                    break;

                default:
                    // contains
                    this.casesListQueryBuilder.where({
                        [property]: {
                            regexp: `/^${value}/i`
                        }
                    });
            }
        }

        // refresh list
        this.loadCasesList();
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'classification', 'age', 'gender', 'dateOfOnset'];

        // check if the authenticated user has WRITE access
        if (this.hasCaseWriteAccess()) {
            columns.push('actions');
        }

        return columns;
    }

    /**
     * Delete specific case from the selected outbreak
     * @param {CaseModel} case
     */
    deleteCase(caseModel: CaseModel) {
        // show confirm dialog to confirm the action
        if (confirm(`Are you sure you want to delete this case: ${caseModel.firstName} ${caseModel.lastName}?`)) {
            // delete case
            this.caseDataService
                .deleteCase(this.selectedOutbreak.id, caseModel.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('Case deleted!');

                    // reload data
                    this.loadCasesList();
                });
        }
    }
}
