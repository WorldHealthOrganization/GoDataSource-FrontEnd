import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { OutbreakModel } from "../../../../core/models/outbreak.model";
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';

import { NgForm } from "@angular/forms";
import { FormHelperService } from "../../../../core/services/helper/form-helper.service";
import { Observable } from "rxjs/Observable";
import { PasswordChangeModel } from '../../../../core/models/password-change.model';
import { QuestionModel } from "../../../../core/models/question.model";

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

    // lists used in dropdowns
    diseasesList$: Observable<any[]>;
    countriesList$: Observable<any[]>;

    // control view / edit - only edit in Create
    viewOnlyCaseInvestigation = false;
    viewOnlyContactFollowup = false;
    viewOnlyLabResults = false;

    // save questionnaires
    caseInvestigationTemplateQuestions: any;
    contactFollowupTemplateQuestions: any;
    labResultsTemplateQuestions: any;

    // We'll initially populate these questions, until we develop the ability to add new questions.
    // TODO Ability to add new question and validations on questions
    questions = [];

    newOutbreak: OutbreakModel = new OutbreakModel();

    constructor(private outbreakDataService: OutbreakDataService,
                private router: Router,
                private snackbarService: SnackbarService,
                private genericDataService: GenericDataService,
                private formHelper: FormHelperService) {
        this.caseInvestigationTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
        this.contactFollowupTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
        this.labResultsTemplateQuestions = JSON.parse(JSON.stringify(this.questions));
        this.diseasesList$ = this.genericDataService.getDiseasesList();
        this.countriesList$ = this.genericDataService.getCountriesList();
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
            // temporary populate array with one question.
            // TODO add validation on questionnaires
            outbreakData.caseInvestigationTemplate.push(new QuestionModel());
            // temporary populate array with one question.
            // TODO add validation on questionnaires
            outbreakData.contactFollowUpTemplate = this.contactFollowupTemplateQuestions;
            outbreakData.contactFollowUpTemplate.push(new QuestionModel());
            // temporary populate array with one question.
            // TODO add validation on questionnaires
            outbreakData.labResultsTemplate = this.labResultsTemplateQuestions;
            outbreakData.labResultsTemplate.push(new QuestionModel());
            // validate end date to be greater than start date
            if (outbreakData.endDate && outbreakData.endDate < outbreakData.startDate) {
                this.snackbarService.showError("End Date needs to be greater than start date");
            } else {

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

    /**
     * Adds a new question
     * @param tab - string identifying the questionnaire
     */
    addNewQuestion(tab) {
        let newQuestion = new QuestionModel();
        switch (tab) {
            case 'case-investigation': {
                newQuestion.order = this.caseInvestigationTemplateQuestions.length + 1;
                this.caseInvestigationTemplateQuestions.push(newQuestion);
                break;
            }
            case 'contact-followup': {
                newQuestion.order = this.contactFollowupTemplateQuestions.length + 1;
                this.contactFollowupTemplateQuestions.push(newQuestion);
                break;
            }
            case 'lab-results': {
                newQuestion.order = this.labResultsTemplateQuestions.length + 1;
                this.labResultsTemplateQuestions.push(newQuestion);
                break;
            }
        }
        this.scrollToEndQuestions();
    }

    /**
     * Delete a question from the questionnaire
     * @param tab
     * @param question
     */
    deleteQuestion(tab, question) {
        if (confirm("Are you sure you want to delete this question? ")) {
            switch (tab) {
                case 'case-investigation': {
                    this.caseInvestigationTemplateQuestions = this.caseInvestigationTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'contact-followup': {
                    this.contactFollowupTemplateQuestions = this.contactFollowupTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'lab-results': {
                    this.labResultsTemplateQuestions = this.labResultsTemplateQuestions.filter(item => item !== question);
                    break;
                }
            }
        }
    }

    /**
     * Duplicate a question. It will be added to the end
     * @param tab
     * @param question
     */
    duplicateQuestion(tab, question) {
        if (confirm("Are you sure you want to duplicate this question? ")) {
            let newQuestion = JSON.parse(JSON.stringify(question));
            switch (tab) {
                case 'case-investigation': {
                    newQuestion.order = this.caseInvestigationTemplateQuestions.length + 1;
                    this.caseInvestigationTemplateQuestions.push(newQuestion);
                    break;
                }
                case 'contact-followup': {
                    newQuestion.order = this.contactFollowupTemplateQuestions.length + 1;
                    this.contactFollowupTemplateQuestions.push(newQuestion);
                    break;
                }
                case 'lab-results': {
                    newQuestion.order = this.labResultsTemplateQuestions.length + 1;
                    this.labResultsTemplateQuestions.push(newQuestion);
                    break;
                }
            }
            this.scrollToEndQuestions();
        }
    }

    /**
     * Delete an answer
     * @param tab
     * @param $event
     */
    deleteAnswer(tab, $event) {
        if (confirm("Are you sure you want to delete this answer? ")) {
            let answerToDelete = $event.answer;
            console.log(answerToDelete);
            //TODO delete answer
            switch (tab) {
                case 'case-investigation': {
                    // this.caseInvestigationTemplateQuestions = this.caseInvestigationTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'contact-followup': {
                    // this.contactFollowupTemplateQuestions = this.contactFollowupTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'lab-results': {
                    // this.labResultsTemplateQuestions = this.labResultsTemplateQuestions.filter(item => item !== question);
                    break;
                }
            }
        }
    }

    /**
     * Link an answer to another question
     * @param tab
     * @param $event
     */
    linkAnswer(tab, $event) {
        if (confirm("Are you sure you want to link this answer? ")) {
            let answerToLink = $event.answer;
            //TODO link answer
            console.log(answerToLink);
            switch (tab) {
                case 'case-investigation': {
                    // this.caseInvestigationTemplateQuestions = this.caseInvestigationTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'contact-followup': {
                    // this.contactFollowupTemplateQuestions = this.contactFollowupTemplateQuestions.filter(item => item !== question);
                    break;
                }
                case 'lab-results': {
                    // this.labResultsTemplateQuestions = this.labResultsTemplateQuestions.filter(item => item !== question);
                    break;
                }
            }
        }
    }

    scrollToEndQuestions() {
        setTimeout(function () {
            let elements = document.querySelectorAll('question');
            let len = elements.length;
            const el = elements[len - 1] as HTMLElement;
            el.scrollIntoView({behavior: "smooth"});
        }, 100);
    }
}
