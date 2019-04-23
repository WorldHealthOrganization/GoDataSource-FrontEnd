import * as _ from 'lodash';
import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, FormControl } from '@angular/forms';
import { GroupBase, GroupDirtyFields } from '../../xt-forms/core';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../core/models/constants';
import { CaseModel } from '../../../core/models/case.model';

@Component({
    selector: 'app-form-case-quick',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-case-quick.component.html',
    styleUrls: ['./form-case-quick.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormCaseQuickComponent,
        multi: true
    }]
})
export class FormCaseQuickComponent extends GroupBase<CaseModel> implements OnInit, GroupDirtyFields {
    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;
    outcomeList$: Observable<any[]>;

    currentDate = Constants.getCurrentDate();

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    displayRefresh: boolean = false;

    visualIDTranslateData: {
        mask: string
    };

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        this.value = new CaseModel(this.value);

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                // if case id mask is not empty show refresh case id mask button
                if (!_.isEmpty(this.selectedOutbreak.caseIdMask)) {
                    this.displayRefresh = true;
                }

                // set visual ID translate data
                this.visualIDTranslateData = {
                    mask: CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
                };

            });
    }

    /**
     * Case Model
     */
    get case(): CaseModel {
        return this.value;
    }

    /**
     * Generate visual ID for case
     */
    generateVisualId() {
        if (!_.isEmpty(this.selectedOutbreak.caseIdMask)) {
            this.case.visualId = CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask);
            this.groupForm.controls.visualId.markAsDirty();
            this.onChange();
        }
    }

    /**
     * Retrieve fields
     */
    getDirtyFields(): {
        [name: string]: FormControl
    } {
        const dirtyControls = {};
        _.forEach(this.groupForm.controls, (control: FormControl, controlName: string) => {
            if (control.dirty) {
                dirtyControls[controlName] = control;
            }
        });
        return dirtyControls;
    }
}
