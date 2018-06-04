import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';


@Component({
    selector: 'app-create-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case.component.html',
    styleUrls: ['./create-case.component.less']
})
export class CreateCaseComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Cases', '..'),
        new BreadcrumbItemModel('Create New Case', '.', true)
    ];

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;

    constructor(
        private router: Router,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
    }

    createNewCase(form: NgForm) {

        // get form fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((currentOutbreak: OutbreakModel) => {
                    // add the new Case
                    this.caseDataService
                        .createCase(currentOutbreak.id, dirtyFields)
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
