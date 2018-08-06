import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { FilterType, FilterModel } from '../../../../shared/components/side-filters/model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.less']
})
export class CasesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // list of existing cases
    casesList$: Observable<CaseModel[]>;

    caseClassificationsList$: Observable<any[]>;
    genderList$: Observable<any[]>;

    // available side filters
    availableSideFilters: FilterModel[];

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private caseDataService: CaseDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        protected route: ActivatedRoute,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService, route.queryParams);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.genericDataService.getGenderList().share();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.refreshList();
            });

        this.availableSideFilters = [
            new FilterModel('firstName', FilterType.TEXT),
            new FilterModel('lastName', FilterType.TEXT),
            new FilterModel('gender', FilterType.MULTISELECT, this.genderList$),
            new FilterModel('age', FilterType.RANGE),
        ];
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Cases
            this.casesList$ = this.caseDataService.getCasesList(this.selectedOutbreak.id, this.queryBuilder);
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have access to create a contact
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'firstName',
            'lastName',
            'classification',
            'age',
            'gender',
            'dateOfOnset',
            'actions'
        ];

        return columns;
    }

    /**
     * Delete specific case from the selected outbreak
     * @param {CaseModel} caseModel
     */
    deleteCase(caseModel: CaseModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CASE', caseModel)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
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
                            this.refreshList();
                        });
                }
            });
    }
}
