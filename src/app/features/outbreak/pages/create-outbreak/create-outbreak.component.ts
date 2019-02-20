import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import 'rxjs/add/operator/switchMap';
import { DialogService } from '../../../../core/services/helper/dialog.service';

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

    outbreakNameValidator: Observable<boolean>;

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
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
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
                        });
                }
            });

        this.outbreakNameValidator = Observable.create((observer) => {
           this.outbreakDataService.checkOutbreakNameUniquenessValidity()
               .subscribe((data) => {
                    console.log(data);
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
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const outbreakData = new OutbreakModel(dirtyFields);

            const loadingDialog = this.dialogService.showLoadingDialog();
            this.outbreakDataService
                .createOutbreak(outbreakData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
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
