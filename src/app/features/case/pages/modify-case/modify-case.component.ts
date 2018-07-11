import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';


@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case.component.html',
    styleUrls: ['./modify-case.component.less']
})
export class ModifyCaseComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_MODIFY_CASE_TITLE', '.', true)
    ];

    outbreakId: string;
    caseId: string;

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
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
        this.route.params.subscribe(params => {
            this.caseId = params.caseId;

            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.outbreakId = selectedOutbreak.id;

                    // get case
                    this.caseDataService
                        .getCase(selectedOutbreak.id, this.caseId)
                        .subscribe(caseDataReturned => {
                            this.caseData = caseDataReturned;
                            // convert dates into ISO format with moment
                            // let hospitalDatesArray = this.caseData.hospitalizationDates;
                            // // moment(hospitalDate).format("YYYY-MM-DD")
                            // this.caseData.hospitalizationDates = hospitalDatesArray
                            //     .map(
                            //         hospitalDate => moment(hospitalDate).format("YYYY-MM-DD")
                            //     );
                        });
                });


        });
    }

    /**
     * Add a new Hospitalization Date slot in UI
     */
    addHospitalizationDate() {
        this.caseData.hospitalizationDates.push(null);
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
        this.caseData.isolationDates.push(null);
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

    modifyCase(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (!form.valid) {
            this.snackbarService.showError('Invalid form!');
            return;
        }

        if (_.isEmpty(dirtyFields)) {
            this.snackbarService.showSuccess('No changes...');
            return;
        }

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {

                // modify the case
                this.caseDataService
                    .modifyCase(selectedOutbreak.id, this.caseId, dirtyFields)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);

                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        this.snackbarService.showSuccess('Case saved!');

                        // navigate to listing page
                        this.router.navigate(['/cases']);
                    });
            });
    }

}
