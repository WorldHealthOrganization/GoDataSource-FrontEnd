import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { OutbreakModel } from "../../../../core/models/outbreak.model";

import { QuestionComponent } from "../../components/question/question.component";
import { MatTabChangeEvent } from "@angular/material";

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

    viewOnlyCaseInvestigation = true;
    viewOnlyContactFollowup = true;
    viewOnlyLabResults = true;
    currentTabIndex = 0;

    caseInvestigationTemplateQuestions: any;
    contactFollowupTemplateQuestions: any;
    labResultsTemplateQuestions: any;


    questions = [
        {
            "value":"Describe the symptoms you have",
            "category": "Physical Examination",
            "order":"1",
            "required": true,
            "answers": [
                {"value":"", "alert":true, "type":"Free Text", "code":"SYM"}
            ]
        },
        {
            "value":"Headaches in the last 24h?",
            "category": "Clinical",
            "order":"2",
            "required": false,
            "answers": [
                {"value":"YES", "alert":true, "type":"Multiple Options", "code":"YES"},
                {"value":"NO", "alert":false, "type":"Multiple Options", "code":"NO"},
                {"value":"Don't know", "alert":true, "type":"Multiple Options", "code":"DK"}
            ]
        },
        {
            "value":"Lorem ipsum dolor sit amet?",
            "category": "Physical Examination",
            "order":"3",
            "required": true,
            "answers": [
                {"value":"YES", "alert":true, "type":"Multiple Options", "code":"YES"},
                {"value":"NO", "alert":false, "type":"Multiple Options", "code":"NO"}
            ]
        }
        ];

    newOutbreak: OutbreakModel = new OutbreakModel();

    constructor(private outbreakDataService:OutbreakDataService,
                private router:Router,
                private snackbarService:SnackbarService) {
        this.caseInvestigationTemplateQuestions = this.questions;
        this.contactFollowupTemplateQuestions = this.questions;
        this.labResultsTemplateQuestions = this.questions;
    }

    createOutbreak(form) {
        if (form.valid) {
            const dirtyFields: any = form.value;
            const outbreakData = new OutbreakModel(dirtyFields);

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

    onQuestionChange(questionChanged){
        console.log("question changed");
        console.log(questionChanged);
    }

    enableEdit(view){
        switch (view){
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

    disableEdit(view){
        switch (view){
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

    selectTab(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
    }


}
