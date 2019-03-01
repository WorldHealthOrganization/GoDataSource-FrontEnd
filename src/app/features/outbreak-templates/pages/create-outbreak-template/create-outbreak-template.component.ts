import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import 'rxjs/add/operator/switchMap';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-create-outbreak-template',
    templateUrl: './create-outbreak-template.component.html',
    styleUrls: ['./create-outbreak-template.component.less']
})
export class CreateOutbreakTemplateComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_OUTBREAK_TEMPLATE_TITLE', '.', true)
    ];

    diseasesList$: Observable<any[]>;

    newOutbreakTemplate: OutbreakTemplateModel = new OutbreakTemplateModel();

    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        private formHelper: FormHelperService,
        private outbreakTemplateDataService: OutbreakTemplateDataService,
        private snackbarService: SnackbarService,
        private router: Router,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        // get the lists for forms
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
    }

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
                .catch((err) => {
                    this.snackbarService.showError((err.message));
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
                .subscribe((newOutbreakTemplate) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_OUTBREAK_TEMPLATES_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/outbreak-templates/${newOutbreakTemplate.id}/modify`]);
                });
        }
    }
}
