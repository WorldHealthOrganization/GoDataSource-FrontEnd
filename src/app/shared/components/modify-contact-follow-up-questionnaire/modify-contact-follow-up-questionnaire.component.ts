import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FollowUpModel } from '../../../core/models/follow-up.model';

export class ModifyContactFollowUpQuestionnaireData {
    followUp: FollowUpModel;
}

@Component({
    selector: 'app-modify-contact-follow-up-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up-questionnaire.component.html',
    styleUrls: ['./modify-contact-follow-up-questionnaire.component.less']
})
export class ModifyContactFollowUpQuestionnaireComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: '600px',
        maxWidth: '600px',
        data: undefined
    };

    constructor(
        public dialogRef: MatDialogRef<ModifyContactFollowUpQuestionnaireComponent>,
        @Inject(MAT_DIALOG_DATA) private data: ModifyContactFollowUpQuestionnaireData
    ) {}
}
