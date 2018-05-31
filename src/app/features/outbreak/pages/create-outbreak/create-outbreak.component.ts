import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { OutbreakModel } from "../../../../core/models/outbreak.model";

import { QuestionComponent } from "../../components/question/question.component";

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

    cancel() {
        if (confirm("Are you sure you want to cancel ? The data will be lost.")) {
            this.router.navigate(['/outbreaks']);
        }
    }

    onQuestionChange(questionChanged){
        console.log("question changed");
        console.log(questionChanged);
    }

}
