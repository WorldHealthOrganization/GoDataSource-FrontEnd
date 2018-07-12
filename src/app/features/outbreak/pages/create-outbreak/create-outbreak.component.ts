import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';

import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { Observable } from 'rxjs/Observable';
import { QuestionModel } from '../../../../core/models/question.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogConfirmAnswer } from '../../../../shared/components';

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

    // TODO Validations on questions
    // TODO Handle translation of values from questions / answers

    newOutbreak: OutbreakModel = new OutbreakModel();

    constructor(private outbreakDataService: OutbreakDataService,
                private router: Router,
                private snackbarService: SnackbarService,
                private genericDataService: GenericDataService,
                private formHelper: FormHelperService,
                private dialogService: DialogService) {
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

            // add questionnaires values to outbreakData
            outbreakData.caseInvestigationTemplate = this.newOutbreak.caseInvestigationTemplate;
            outbreakData.contactFollowUpTemplate = this.newOutbreak.contactFollowUpTemplate;
            outbreakData.labResultsTemplate = this.newOutbreak.labResultsTemplate;

            // validate end date to be greater than start date
            if (outbreakData.endDate && outbreakData.endDate < outbreakData.startDate) {
                this.snackbarService.showError('End Date needs to be greater than start date');
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
        const newQuestion = new QuestionModel();
        switch (tab) {
            case 'case-investigation': {
                newQuestion.order = this.newOutbreak.caseInvestigationTemplate.length + 1;
                this.newOutbreak.caseInvestigationTemplate.push(newQuestion);
                break;
            }
            case 'contact-followup': {
                newQuestion.order = this.newOutbreak.contactFollowUpTemplate.length + 1;
                this.newOutbreak.contactFollowUpTemplate.push(newQuestion);
                break;
            }
            case 'lab-results': {
                newQuestion.order = this.newOutbreak.labResultsTemplate.length + 1;
                this.newOutbreak.labResultsTemplate.push(newQuestion);
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
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    switch (tab) {
                        case 'case-investigation': {
                            this.newOutbreak.caseInvestigationTemplate = this.newOutbreak.caseInvestigationTemplate.filter(item => item !== question);
                            break;
                        }
                        case 'contact-followup': {
                            this.newOutbreak.contactFollowUpTemplate = this.newOutbreak.contactFollowUpTemplate.filter(item => item !== question);
                            break;
                        }
                        case 'lab-results': {
                            this.newOutbreak.labResultsTemplate = this.newOutbreak.labResultsTemplate.filter(item => item !== question);
                            break;
                        }
                    }
                }
            });
    }

    /**
     * Duplicate a question. It will be added to the end
     * @param tab
     * @param question
     */
    duplicateQuestion(tab, question) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DUPLICATE_QUESTION')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    const newQuestion = JSON.parse(JSON.stringify(question));
                    switch (tab) {
                        case 'case-investigation': {
                            newQuestion.order = this.newOutbreak.caseInvestigationTemplate.length + 1;
                            this.newOutbreak.caseInvestigationTemplate.push(newQuestion);
                            break;
                        }
                        case 'contact-followup': {
                            newQuestion.order = this.newOutbreak.contactFollowUpTemplate.length + 1;
                            this.newOutbreak.contactFollowUpTemplate.push(newQuestion);
                            break;
                        }
                        case 'lab-results': {
                            newQuestion.order = this.newOutbreak.labResultsTemplate.length + 1;
                            this.newOutbreak.labResultsTemplate.push(newQuestion);
                            break;
                        }
                    }
                    this.scrollToEndQuestions();
                }
            });
    }

    /**
     * TODO Link an answer to another question
     * @param tab
     * @param $event
     */
    linkAnswer(tab, $event) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_LINK_QUESTION_ANSWER')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    const answerToLink = $event.answer;
                    // TODO link answer
                    switch (tab) {
                        case 'case-investigation': {
                            break;
                        }
                        case 'contact-followup': {
                            break;
                        }
                        case 'lab-results': {
                            break;
                        }
                    }
                }
            });
    }

    /**
     * Scroll to the last question
     */
    scrollToEndQuestions() {
        setTimeout(function () {
            const elements = document.querySelectorAll('app-question');
            const len = elements.length;
            const el = elements[len - 1] as HTMLElement;
            el.scrollIntoView({behavior: 'smooth'});
        }, 100);
    }
}
