import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { Observable } from 'rxjs/Observable';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';

@Component({
    selector: 'app-create-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-outbreak.component.html',
    styleUrls: ['./create-outbreak.component.less']
})
export class CreateOutbreakComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_OUTBREAK_TITLE', '.', true)
    ];

    // lists used in dropdowns
    diseasesList$: Observable<any[]>;
    countriesList$: Observable<any[]>;

    newOutbreak: OutbreakModel = new OutbreakModel();

    constructor(
        private outbreakDataService: OutbreakDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private formHelper: FormHelperService,
        private i18nService: I18nService
    ) {
        super();
    }

    ngOnInit() {
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY);
    }

    createOutbreak(stepForms: NgForm[]) {

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const outbreakData = new OutbreakModel(dirtyFields);

            this.outbreakDataService
                .createOutbreak(outbreakData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON');
                    // load language tokens so they will be available
                    this.i18nService.loadUserLanguage().subscribe();
                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate(['/outbreaks']);
                });
        }
    }

}
