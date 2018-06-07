import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakDataService} from "../../../../core/services/data/outbreak.data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {OutbreakModel} from "../../../../core/models/outbreak.model";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { MatTabChangeEvent } from "@angular/material";

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

    outbreakId: string;
    outbreak: OutbreakModel = new OutbreakModel();

    // controls for switching between view and edit mode
    viewOnlyCaseInvestigation = true;
    viewOnlyContactFollowup = true;
    viewOnlyLabResults = true;
    currentTabIndex = 0;

    // questionnaires for outbreak
    caseInvestigationTemplateQuestions: any;
    contactFollowupTemplateQuestions: any;
    labResultsTemplateQuestions: any;

    constructor(private outbreakDataService:OutbreakDataService,
                private route:ActivatedRoute,
                private router:Router,
                private snackbarService:SnackbarService) {

        this.route.params.subscribe(params => {
            this.outbreakId = params.outbreakId;

           // get the outbreak to modify
            this.outbreakDataService
                .getOutbreak(this.outbreakId)
                .subscribe(outbreakData => {
                    this.outbreak = outbreakData;
                    this.caseInvestigationTemplateQuestions = outbreakData.caseInvestigationTemplate;
                    this.contactFollowupTemplateQuestions = outbreakData.contactFollowUpTemplate;
                    this.labResultsTemplateQuestions = outbreakData.labResultsTemplate;
                });



        });
    }

    modifyOutbreak(form) {
        if (form.valid) {
            const dirtyFields: any = form.value;

            // assign the questionnaires objects to the outbreak data
            dirtyFields.caseInvestigationTemplate = this.caseInvestigationTemplateQuestions;
            dirtyFields.contactFollowupTemplate = this.contactFollowupTemplateQuestions;
            dirtyFields.labResultsTemplate = this.labResultsTemplateQuestions;

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

    /**
     * Enable edit on questionnaires tabs
     */
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

    /**
     * Disable edit on questionnaires tabs
     */
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

    /**
     *  Save the current tab index
     */
    selectTab(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
    }
}
