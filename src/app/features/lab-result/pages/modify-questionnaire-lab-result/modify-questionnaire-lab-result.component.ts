import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { throwError } from 'rxjs';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { LabResultModel } from 'app/core/models/lab-result.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-modify-questionnaire-lab-result',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-questionnaire-lab-result.component.html',
    styleUrls: ['./modify-questionnaire-lab-result.component.less']
})
export class ModifyQuestionnaireLabResultComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    labResultId: string;
    labResultData: LabResultModel = new LabResultModel();

    // constants
    LabResultModel = LabResultModel;
    EntityModel = EntityModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private labResultDataService: LabResultDataService,
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

        // retrieve data
        this.route.params
            .subscribe((params: { labResultId }) => {
                this.labResultId = params.labResultId;
                this.retrieveLabResultData();
            });

        // retrieve outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // breadcrumbs
                this.retrieveLabResultData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (LabResultModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_LAB_RESULTS_TITLE', '/lab-results')
            );
        }

        // data
        if (
            this.labResultData &&
            this.labResultData.id
        ) {
            // model bread
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.labResultData.dateSampleTaken,
                    `/lab-results/${EntityModel.getLinkForEntityType(this.labResultData.personType)}/${this.labResultData.personId}/${this.labResultData.id}/${this.viewOnly ? 'view' : 'modify'}`
                )
            );

            // view / modify breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.viewOnly ? 'LNG_PAGE_VIEW_LAB_RESULT_TITLE' : 'LNG_PAGE_MODIFY_LAB_RESULT_TITLE',
                    null,
                    true,
                    {},
                    this.labResultData
                )
            );
        }
    }

    /**
     * Retrieve information
     */
    private retrieveLabResultData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.labResultId
        ) {
            // show loading
            this.showLoadingDialog(false);
            this.labResultDataService
                .getOutbreakLabResult(
                    this.selectedOutbreak.id,
                    this.labResultId
                )
                .subscribe((labResultData) => {
                    // keep data
                    this.labResultData = labResultData;

                    // update breadcrumb
                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Modify
     */
    modifyLabResult(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // show loading
        this.showLoadingDialog();

        // modify
        this.labResultDataService
            .modifyLabResult(
                this.selectedOutbreak.id,
                this.labResultId,
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
            .subscribe(() => {
                // update data
                this.retrieveLabResultData();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LAB_RESULT_ACTION_MODIFY_LAB_RESULT_SUCCESS_MESSAGE');

                // loading will be closed by retrieveLabResultData() method
                // NOTHING TO DO
            });
    }
}
