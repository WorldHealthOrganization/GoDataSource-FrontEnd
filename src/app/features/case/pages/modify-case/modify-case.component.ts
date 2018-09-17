import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case.component.html',
    styleUrls: ['./modify-case.component.less']
})
export class ModifyCaseComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
    ];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();
    caseId: string;

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    genderList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;

    Constants = Constants;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.genericDataService.getGenderList();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

        this.route.params.subscribe((params: { caseId }) => {
            this.caseId = params.caseId;

            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.selectedOutbreak = selectedOutbreak;

                    // get case
                    this.caseDataService
                        .getCase(selectedOutbreak.id, this.caseId)
                        .subscribe(caseDataReturned => {
                            this.caseData = new CaseModel(caseDataReturned);
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    this.viewOnly ? 'LNG_PAGE_VIEW_CASE_TITLE' : 'LNG_PAGE_MODIFY_CASE_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.caseData
                                )
                            );
                        });
                });


        });
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
    }

    modifyCase(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // omit fields that are NOT visible
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        // modify the Case
        this.caseDataService
            .modifyCase(this.selectedOutbreak.id, this.caseId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE');

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/cases']);
            });
    }
}
