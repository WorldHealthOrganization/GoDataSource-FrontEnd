import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';

@Component({
    selector: 'app-create-outbreak-template',
    templateUrl: './create-outbreak-template.component.html',
    styleUrls: ['./create-outbreak-template.component.less']
})
export class CreateOutbreakTemplateComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user details
    authUser: UserModel;

    diseasesList$: Observable<any[]>;
    followUpsTeamAssignmentAlgorithm$: Observable<any[]>;

    newOutbreakTemplate: OutbreakTemplateModel = new OutbreakTemplateModel();

    outbreakTemplateNameValidator$: Observable<boolean | IGeneralAsyncValidatorResponse>;

    /**
     * Constructor
     */
    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        private formHelper: FormHelperService,
        private outbreakTemplateDataService: OutbreakTemplateDataService,
        private snackbarService: SnackbarService,
        private router: Router,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the lists for forms
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.followUpsTeamAssignmentAlgorithm$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM);

        this.outbreakTemplateNameValidator$ = new Observable((observer) => {
            this.outbreakTemplateDataService.checkOutbreakTemplateNameUniquenessValidity(this.newOutbreakTemplate.name)
                .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                    observer.next(isValid);
                    observer.complete();
                });
        });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (OutbreakTemplateModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '/outbreak-templates'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TITLE', '.', true));
    }

    /**
     * Create Outbreak Template
     */
    createOutbreakTemplate(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const outbreakTemplateData = new OutbreakTemplateModel(dirtyFields);

            const loadingDialog = this.dialogService.showLoadingDialog();
            this.outbreakTemplateDataService
                .createOutbreakTemplate(outbreakTemplateData)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError((err.message));
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newOutbreakTemplate) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_OUTBREAK_TEMPLATES_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    // method handles disableDirtyConfirm too...
                    this.redirectToProperPageAfterCreate(
                        this.router,
                        this.redirectService,
                        this.authUser,
                        OutbreakTemplateModel,
                        'outbreak-templates',
                        newOutbreakTemplate.id
                    );
                });
        }
    }
}
