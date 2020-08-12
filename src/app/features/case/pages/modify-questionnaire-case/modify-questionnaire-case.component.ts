import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { throwError } from 'rxjs';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-questionnaire-case.component.html',
    styleUrls: ['./modify-questionnaire-case.component.less']
})
export class ModifyQuestionnaireCaseComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    caseId: string;
    caseData: CaseModel = new CaseModel();

    // constants
    CaseModel = CaseModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // show loading
        this.showLoadingDialog(false);

        // retrieve case
        this.route.params
            .subscribe((params: { caseId }) => {
                this.caseId = params.caseId;
                this.retrieveCaseData();
            });

        // retrieve outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // breadcrumbs
                this.retrieveCaseData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // case list page
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // current page breadcrumb
        if (this.caseData) {
            // current page title
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.viewOnly ? 'LNG_PAGE_VIEW_CASE_TITLE' : 'LNG_PAGE_MODIFY_CASE_TITLE',
                    '.',
                    true,
                    {},
                    this.caseData
                )
            );
        }
    }

    /**
     * Case data
     */
    retrieveCaseData() {
        // get case
        if (
            this.selectedOutbreak.id &&
            this.caseId
        ) {
            // show loading
            this.showLoadingDialog(false);

            // get case
            this.caseDataService
                .getCase(
                    this.selectedOutbreak.id,
                    this.caseId
                )
                .subscribe((caseData: CaseModel) => {
                    // keep data
                    this.caseData = caseData;

                    // initialize breadcrumbs
                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Modify case
     */
    modifyCase(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // show loading
        this.showLoadingDialog();

        // modify the Case
        this.caseDataService
            .modifyCase(
                this.selectedOutbreak.id,
                this.caseId,
                dirtyFields
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // hide loading
                    this.hideLoadingDialog();

                    return throwError(err);
                })
            )
            .subscribe((modifiedCase: CaseModel) => {
                // update case data
                this.retrieveCaseData();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE');

                // loading will be closed by retrieveCaseData() method
                // NOTHING TO DO
            });
    }
}
