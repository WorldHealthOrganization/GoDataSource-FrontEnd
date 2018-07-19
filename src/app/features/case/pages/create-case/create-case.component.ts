import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';

import * as _ from 'lodash';
import { DateRangeModel } from '../../../../core/models/date-range.model';

@Component({
    selector: 'app-create-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case.component.html',
    styleUrls: ['./create-case.component.less']
})
export class CreateCaseComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_TITLE', '.', true)
    ];

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;

    constructor(
        private router: Router,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
        this.caseClassificationsList$ = this.genericDataService.getCaseClassificationsList();
        this.caseRiskLevelsList$ = this.genericDataService.getCaseRiskLevelsList();
    }

    ngOnInit() {
        // by default, enforce Case having an address
        this.caseData.addresses.push(new AddressModel());
        // ...and a document
        this.caseData.documents.push(new DocumentModel());
        // ...and a hospitalization date range
        this.caseData.hospitalizationDates.push(new DateRangeModel());
        // ...and an isolation date range
        this.caseData.isolationDates.push(new DateRangeModel());
    }

    /**
     * Add a new Hospitalization Date slot in UI
     */
    addHospitalizationDate() {
        this.caseData.hospitalizationDates.push(new DateRangeModel());
    }

    /**
     * Remove a Hospitalization Date from the list
     */
    deleteHospitalizationDate(index) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HOSPITALIZATION_DATE')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    this.caseData.hospitalizationDates.splice(index, 1);
                }
            });
    }

    /**
     * Add a new Isolation Date slot in UI
     */
    addIsolationDate() {
        this.caseData.isolationDates.push(new DateRangeModel());
    }

    /**
     * Remove an Isolation Date from the list
     */
    deleteIsolationDate(index) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ISOLATION_DATE')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    this.caseData.isolationDates.splice(index, 1);
                }
            });
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
    }

    createNewCase(stepForms: NgForm[]) {

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

       // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // add the new Case
                    this.caseDataService
                        .createCase(selectedOutbreak.id, dirtyFields)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('Case added!');

                            // navigate to listing page
                            this.router.navigate(['/cases']);
                        });
                });
        }
    }

}
