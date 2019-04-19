import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-create-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-outbreak.component.html',
    styleUrls: ['./create-outbreak.component.less']
})
export class CreateOutbreakComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_OUTBREAK_TITLE', '.', true)
    ];

    // lists used in dropdowns
    diseasesList$: Observable<LabelValuePair[]>;
    countriesList$: Observable<LabelValuePair[]>;
    geographicalLevelsList$: Observable<any[]>;

    newOutbreak: OutbreakModel = new OutbreakModel();

    creatingOutbreakFromTemplate: boolean = false;

    outbreakNameValidator$: Observable<boolean | IGeneralAsyncValidatorResponse>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private router: Router,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private formHelper: FormHelperService,
        private route: ActivatedRoute,
        private outbreakTemplateDataService: OutbreakTemplateDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY)
            .pipe(
                map(
                    (countries) => _.map(countries, (country: LabelValuePair) => {
                        country.value = {
                            id: country.value
                        };
                        return country;
                    })
                )
            );
        // get the outbreak template
        this.route.queryParams
            .subscribe((queryParams: { outbreakTemplateId }) => {
                if (queryParams.outbreakTemplateId) {
                    this.outbreakTemplateDataService.getOutbreakTemplate(queryParams.outbreakTemplateId)
                        .subscribe((outbreakTemplate: OutbreakTemplateModel) => {
                            // delete the id of the outbreak template
                            delete outbreakTemplate.id;

                            // make the new outbreak which is merged with the outbreak template
                            this.newOutbreak = new OutbreakModel(outbreakTemplate);

                            // creating clone, we need to keep data from the template
                            this.creatingOutbreakFromTemplate = true;
                        });
                }
            });

        this.outbreakNameValidator$ = new Observable((observer) => {
           this.outbreakDataService.checkOutbreakNameUniquenessValidity(this.newOutbreak.name)
               .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                    observer.next(isValid);
                    observer.complete();
               });
        });
    }

    /**
     * Compare countries
     * @param o1
     * @param o2
     */
    compareCountryWith(o1: {id: string}, o2: {id: string}): boolean {
        return (o1 ? o1.id : undefined) === (o2 ? o2.id : undefined);
    }

    createOutbreak(stepForms: NgForm[]) {
        // get forms fields
        let dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // validate outbreak
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // are we creating an outbreak from a template ?
            if (this.creatingOutbreakFromTemplate) {
                dirtyFields = {
                    ...this.newOutbreak,
                    ...dirtyFields
                };
            }

            // create outbreak
            const outbreakData = new OutbreakModel(dirtyFields);
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.outbreakDataService
                .createOutbreak(outbreakData)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newOutbreak) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_SUCCESS_MESSAGE_BUTTON');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to modify page of the new outbreak
                    this.disableDirtyConfirm();
                    this.router.navigate([`/outbreaks/${newOutbreak.id}/modify`]);
                });
        }
    }
}
