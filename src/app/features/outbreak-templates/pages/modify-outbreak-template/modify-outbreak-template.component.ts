import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-modify-outbreak-template',
    templateUrl: './modify-outbreak-template.component.html',
    styleUrls: ['./modify-outbreak-template.component.less']
})
export class ModifyOutbreakTemplateComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    OutbreakTemplateModel = OutbreakTemplateModel;

    // authenticated user
    authUser: UserModel;
    // id of the outbreak to modify
    outbreakTemplateId: string;
    // outbreak to modify
    outbreakTemplate: OutbreakTemplateModel = new OutbreakTemplateModel();
    // list of diseases
    diseasesList$: Observable<any[]>;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private outbreakTemplateDataService: OutbreakTemplateDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialization
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the lists for form
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);

        // show loading
        this.showLoadingDialog(false);

        this.route.params
            .subscribe((params: { outbreakTemplateId }) => {
                this.outbreakTemplateId = params.outbreakTemplateId;
                // get the outbreak to modify
                this.outbreakTemplateDataService
                    .getOutbreakTemplate(this.outbreakTemplateId)
                    .subscribe(outbreakTemplateData => {
                        this.outbreakTemplate = outbreakTemplateData;

                        // update breadcrumbs
                        this.initializeBreadcrumbs();

                        // hide loading
                        this.hideLoadingDialog();
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (OutbreakTemplateModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '/outbreak-templates')
            );
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_OUTBREAK_TEMPLATE_TITLE' : 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_TITLE',
                '.',
                true,
                {},
                this.outbreakTemplate
            )
        );
    }

    /**
     * Modify outbreak template
     */
    modifyOutbreakTemplate(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // show loading
        this.showLoadingDialog();

        // modify the outbreak template
        this.outbreakTemplateDataService
            .modifyOutbreakTemplate(this.outbreakTemplateId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((modifiedOutbreakTemplate) => {
                // update model
                this.outbreakTemplate = modifiedOutbreakTemplate;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
