import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { MatTabChangeEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { QuestionModel } from '../../../../core/models/question.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import * as _ from 'lodash';

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '/outbreaks'),
        new BreadcrumbItemModel('Modify Outbreak', '.', true)
    ];

    // id of the outbreak to modify
    outbreakId: string;
    // outbreak to modify
    outbreak: OutbreakModel = new OutbreakModel();
    // list of diseases
    diseasesList$: Observable<any[]>;
    // list of countries
    countriesList$: Observable<any[]>;

    // controls for switching between view and edit mode
    viewOnlyCaseInvestigation = true;
    viewOnlyContactFollowup = true;
    viewOnlyLabResults = true;
    currentTabIndex = 0;

    constructor(private outbreakDataService: OutbreakDataService,
                private route: ActivatedRoute,
                private router: Router,
                private genericDataService: GenericDataService,
                private snackbarService: SnackbarService,
                private dialogService: DialogService) {

        this.route.params.subscribe(params => {
            this.outbreakId = params.outbreakId;

            // get the outbreak to modify
            this.outbreakDataService
                .getOutbreak(this.outbreakId)
                .subscribe(outbreakData => {
                    this.outbreak = outbreakData;
                    this.diseasesList$ = this.genericDataService.getDiseasesList();
                    this.countriesList$ = this.genericDataService.getCountriesList();
                    // set questions and answers to new property to false.
                    this.setNewFalse(this.outbreak.caseInvestigationTemplate);
                    this.setNewFalse(this.outbreak.contactFollowUpTemplate);
                    this.setNewFalse(this.outbreak.labResultsTemplate);
                });
        });
    }

    /**
     * Handles form submit
     * @param form
     */
    modifyOutbreak(form) {
        if (form.valid) {
            const dirtyFields: any = form.value;
            console.log(dirtyFields);

            // assign the questionnaires objects to the outbreak data
            dirtyFields.caseInvestigationTemplate = this.outbreak.caseInvestigationTemplate;
            dirtyFields.contactFollowUpTemplate = this.outbreak.contactFollowUpTemplate;
            dirtyFields.labResultsTemplate = this.outbreak.labResultsTemplate;

            console.log(dirtyFields);
            // validate end date to be greater than start date
            if (dirtyFields.endDate && dirtyFields.endDate < dirtyFields.startDate) {
                this.snackbarService.showError('End Date needs to be greater than start date');
            } else {

                // modify the outbreak
                this.outbreakDataService
                    .modifyOutbreak(this.outbreakId, dirtyFields)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);
                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        this.snackbarService.showSuccess('Outbreak modified!');
                        // navigate to listing page
                        this.router.navigate(['/outbreaks']);
                    });
            }
        }
    }

    /**
     * Enable edit on questionnaires tabs
     */
    enableEdit(view) {
        switch (view) {
            case 'case-investigation' : {
                this.viewOnlyCaseInvestigation = false;
                break;
            }
            case 'contact-followup' : {
                this.viewOnlyContactFollowup = false;
                break;
            }
            case 'lab-results' : {
                this.viewOnlyLabResults = false;
                break;
            }
        }
    }

    /**
     * Disable edit on questionnaires tabs
     */
    disableEdit(view) {
        switch (view) {
            case 'case-investigation' : {
                this.viewOnlyCaseInvestigation = true;
                break;
            }
            case 'contact-followup' : {
                this.viewOnlyContactFollowup = true;
                break;
            }
            case 'lab-results' : {
                this.viewOnlyLabResults = true;
                break;
            }
        }
    }

    /**
     *  Save the current tab index
     */
    selectTab(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
    }

    /**
     * Adds a new question
     * @param tab - string identifying the questionnaire
     */
    addNewQuestion(tab) {
        const newQuestion = new QuestionModel();
        switch (tab) {
            case 'case-investigation': {
                newQuestion.order = this.outbreak.caseInvestigationTemplate.length + 1;
                this.outbreak.caseInvestigationTemplate.push(new QuestionModel());
                break;
            }
            case 'contact-followup': {
                newQuestion.order = this.outbreak.contactFollowUpTemplate.length + 1;
                this.outbreak.contactFollowUpTemplate.push(newQuestion);
                break;
            }
            case 'lab-results': {
                newQuestion.order = this.outbreak.labResultsTemplate.length + 1;
                this.outbreak.labResultsTemplate.push(newQuestion);
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
                            this.outbreak.caseInvestigationTemplate = this.outbreak.caseInvestigationTemplate.filter(item => item !== question);
                            break;
                        }
                        case 'contact-followup': {
                            this.outbreak.contactFollowUpTemplate = this.outbreak.contactFollowUpTemplate.filter(item => item !== question);
                            break;
                        }
                        case 'lab-results': {
                            this.outbreak.labResultsTemplate = this.outbreak.labResultsTemplate.filter(item => item !== question);
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
                            newQuestion.order = this.outbreak.caseInvestigationTemplate.length + 1;
                            this.outbreak.caseInvestigationTemplate.push(newQuestion);
                            break;
                        }
                        case 'contact-followup': {
                            newQuestion.order = this.outbreak.contactFollowUpTemplate.length + 1;
                            this.outbreak.contactFollowUpTemplate.push(newQuestion);
                            break;
                        }
                        case 'lab-results': {
                            newQuestion.order = this.outbreak.labResultsTemplate.length + 1;
                            this.outbreak.labResultsTemplate.push(newQuestion);
                            break;
                        }
                    }
                    this.scrollToEndQuestions();
                }
            });
    }

    /**
     * Link an answer to another question
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
            });
    }

    /**
     * Scroll to the bottom
     */
    scrollToEndQuestions() {
        setTimeout(function () {
            const elements = document.querySelectorAll('app-question');
            const len = elements.length;
            const el = elements[len - 1] as HTMLElement;
            el.scrollIntoView({behavior: 'smooth'});
        }, 100);
    }

    /**
     * Set attribute new to false for all questions and answers in the array.
     */
    setNewFalse( questionsArray = [] ) {
        if ( !_.isEmpty(questionsArray)) {
            _.forEach(questionsArray, function(question, key) {
                questionsArray[key].new = false;
                if ( !_.isEmpty(questionsArray[key].answers) ) {
                    _.forEach(questionsArray[key].answers, function (answer, keyAnswer) {
                        questionsArray[key].answers[keyAnswer].new = false;
                    });
                }
                });
            }
        }

}
