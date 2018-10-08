import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { DateRangeModel } from '../../../../core/models/date-range.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormDatepickerComponent } from '../../../../shared/xt-forms/components/form-datepicker/form-datepicker.component';
import { AgeModel } from '../../../../core/models/age.model';
import { FormAgeComponent } from '../../../../shared/components/form-age/form-age.component';

@Component({
    selector: 'app-create-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case.component.html',
    styleUrls: ['./create-case.component.less']
})
export class CreateCaseComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_TITLE', '.', true)
    ];

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    genderList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    serverToday: Moment = null;

    @ViewChild('dob') dobComponent: FormDatepickerComponent;
    dobDirty: boolean = false;
    @ViewChild('age') ageComponent: FormAgeComponent;
    ageDirty: boolean = false;

    constructor(
        private router: Router,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private genericDataService: GenericDataService
    ) {
        super();
    }

    ngOnInit() {
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        // by default, enforce Case having an address
        this.caseData.addresses.push(new AddressModel());
        // ...and a document
        this.caseData.documents.push(new DocumentModel());
        // ...and a hospitalization date range
        this.caseData.hospitalizationDates.push(new DateRangeModel());
        // ...and an isolation date range
        this.caseData.isolationDates.push(new DateRangeModel());

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
            });
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        // save control dirty state since ngIf removes it...and we can't use fxShow / Hide since it doesn't reinitialize component & rebind values
        if (this.ageSelected) {
            this.ageDirty = this.ageComponent && this.ageComponent.control.dirty;
        } else {
            this.dobDirty = this.dobComponent && this.dobComponent.control.dirty;
        }

        // switch element that we want to see
        this.ageSelected = ageSelected;

        // make sure we set dirtiness back
        setTimeout(() => {
            // make control dirty again
            if (
                this.ageSelected &&
                this.ageDirty &&
                this.ageComponent
            ) {
                // make sure we have control
                setTimeout(() => {
                    this.ageComponent.control.markAsDirty();
                });
            } else if (
                !this.ageSelected &&
                this.dobDirty &&
                this.dobComponent
            ) {
                // make sure we have control
                setTimeout(() => {
                    this.dobComponent.control.markAsDirty();
                });
            }
        });
    }

    createNewCase(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // add age information if necessary
        if (dirtyFields.dob) {
            AgeModel.addAgeFromDob(
                dirtyFields,
                null,
                dirtyFields.dob
            );
        } else if (dirtyFields.age) {
            dirtyFields.dob = null;
        }

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Case
            this.caseDataService
                .createCase(this.selectedOutbreak.id, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate(['/cases']);
                });
        }
    }

    /**
     * DOB changed handler
     * @param dob
     * @param date
     */
    dobChanged(
        dob: FormDatepickerComponent,
        date: Moment
    ) {
        AgeModel.addAgeFromDob(
            this.caseData,
            dob,
            date
        );
    }

    /**
     * Age changed
     */
    ageChanged() {
        this.caseData.dob = null;
    }
}
