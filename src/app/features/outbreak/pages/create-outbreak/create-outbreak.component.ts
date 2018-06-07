import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { OutbreakModel } from "../../../../core/models/outbreak.model";
import * as _ from 'lodash';

import { NgForm } from "@angular/forms";
import { FormHelperService } from "../../../../core/services/helper/form-helper.service";

@Component({
    selector: 'app-create-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-outbreak.component.html',
    styleUrls: ['./create-outbreak.component.less']
})
export class CreateOutbreakComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '..'),
        new BreadcrumbItemModel('Create New Outbreak', '.', true)
    ];

    viewOnlyCaseInvestigation = false;
    viewOnlyContactFollowup = false;
    viewOnlyLabResults = false;

    caseInvestigationTemplateQuestions: any;
    contactFollowupTemplateQuestions: any;
    labResultsTemplateQuestions: any;

    // We'll initially populate these questions, until we develop the ability to add new questions.
    // TODO Ability to add new question
    questions = [
        {
            "value": "Describe the symptoms you have",
            "category": "Physical Examination",
            "order": "1",
            "required": true,
            "answers": [
                {"value": "", "alert": true, "type": "Free Text", "code": "SYM"}
            ]
        },
        {
            "value": "Headaches in the last 24h?",
            "category": "Clinical",
            "order": "2",
            "required": false,
            "answers": [
                {"value": "YES", "alert": true, "type": "Multiple Options", "code": "YES"},
                {"value": "NO", "alert": false, "type": "Multiple Options", "code": "NO"},
                {"value": "Don't know", "alert": true, "type": "Multiple Options", "code": "DK"}
            ]
        },
        {
            "value": "Lorem ipsum dolor sit amet?",
            "category": "Physical Examination",
            "order": "3",
            "required": true,
            "answers": [
                {"value": "YES", "alert": true, "type": "Multiple Options", "code": "YES"},
                {"value": "NO", "alert": false, "type": "Multiple Options", "code": "NO"}
            ]
        }
    ];

    newOutbreak: OutbreakModel = new OutbreakModel();

    constructor(private outbreakDataService: OutbreakDataService,
                private router: Router,
                private snackbarService: SnackbarService,
                private formHelper: FormHelperService) {
        this.caseInvestigationTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
        this.contactFollowupTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
        this.labResultsTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
    }

    createOutbreak(stepForms: NgForm[]) {

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            const outbreakData = new OutbreakModel(dirtyFields);
            outbreakData.caseInvestigationTemplate = this.caseInvestigationTemplateQuestions;
            outbreakData.contactFollowUpTemplate = this.contactFollowupTemplateQuestions;
            outbreakData.labResultsTemplate = this.labResultsTemplateQuestions;
            this.outbreakDataService
                .createOutbreak(outbreakData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(response => {
                    this.snackbarService.showSuccess('Outbreak created');
                    this.router.navigate(['/outbreaks']);
                });
        }
    }
}
