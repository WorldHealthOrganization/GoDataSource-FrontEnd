import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FollowUpModel } from '../../../core/models/follow-up.model';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { DialogAnswer, DialogAnswerButton, DialogAnswerInputValue } from '../dialog/dialog.component';
import { FollowUpsDataService } from '../../../core/services/data/follow-ups.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

export class ModifyContactFollowUpQuestionnaireData {
    constructor(
        public followUp: FollowUpModel,
        public outbreak: OutbreakModel
    ) {}
}

@Component({
    selector: 'app-modify-contact-follow-up-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up-questionnaire-dialog.component.html',
    styleUrls: ['./modify-contact-follow-up-questionnaire-dialog.component.less']
})
export class ModifyContactFollowUpQuestionnaireDialogComponent implements OnInit {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: '90%',
        maxWidth: '90%',
        data: undefined,
        panelClass: 'dialog-modify-contact-follow-up-questionnaire'
    };

    loading: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<ModifyContactFollowUpQuestionnaireDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ModifyContactFollowUpQuestionnaireData,
        private followUpsDataService: FollowUpsDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService
    ) {}

    ngOnInit() {
        // make sure we have the latest follow-up data
        this.followUpsDataService.getFollowUp(
            this.data.outbreak.id,
            this.data.followUp.personId,
            this.data.followUp.id
        ).subscribe((followUp: FollowUpModel) => {
            this.data.followUp = followUp;
            this.loading = false;
        });
    }

    cancel() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }

    save(form: NgForm) {
        // validate fields
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve changed fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // save data
        this.loading = true;
        this.followUpsDataService.modifyFollowUp(
            this.data.outbreak.id,
            this.data.followUp.personId,
            this.data.followUp.id,
            dirtyFields
        ).catch((err) => {
            this.loading = false;
            this.snackbarService.showError(err.message);
            return ErrorObservable.create(err);
        }).subscribe(() => {
            this.snackbarService.showSuccess('LNG_DIALOG_MODIFY_FOLLOW_UP_QUESTIONNAIRE_BUTTON_SAVE_SUCCESS_MESSAGE');

            // close popup
            this.dialogRef.close(new DialogAnswer(
                DialogAnswerButton.Yes,
                new DialogAnswerInputValue(
                    this.data.followUp
                )
            ));
        });

    }
}
