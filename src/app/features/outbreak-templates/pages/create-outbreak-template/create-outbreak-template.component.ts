import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-create-outbreak-template',
    templateUrl: './create-outbreak-template.component.html',
    styleUrls: ['./create-outbreak-template.component.less']
})
export class CreateOutbreakTemplateComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '..'),
        new BreadcrumbItemModel('create outbreak', '.', true)
    ];

    diseasesList$: Observable<any[]>;
    countriesList$: Observable<any[]>;

    newOutbreakTemplate: OutbreakTemplateModel = new OutbreakTemplateModel();

    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        private formHelper: FormHelperService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private router: Router)
    {
        super();
    }

    ngOnInit() {
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
        );
    }

    createOutbreaktemplate(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const outbreakTemplateData = new OutbreakTemplateModel(dirtyFields);

            this.outbreakDataService
                .createOutbreakTemplate(outbreakTemplateData)
                .catch((err) => {
                    this.snackbarService.showError((err.message));
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('outbreak template created');
                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate(['/outbreak-templates']);
                });
        }
    };
}
