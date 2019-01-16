import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { FormModifyQuestionnaireBreadcrumbsData, FormModifyQuestionnaireComponent, FormModifyQuestionnaireUpdateData } from '../../../../shared/components';
import { OutbreakQestionnaireTypeEnum } from '../../../../core/enums/outbreak-qestionnaire-type.enum';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-outbreak-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-questionnaire.component.html',
    styleUrls: ['./outbreak-questionnaire.component.less']
})
export class OutbreakQuestionnaireComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // outbreak to modify
    outbreak: OutbreakModel;

    /**
     * Questionnaire
     */
    @ViewChild('questionnaire') questionnaire: FormModifyQuestionnaireComponent;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService
    ) {
        super();
    }

    /**
     * Initialized
     */
    ngOnInit() {
        // get outbreak
        this.route.params
            .subscribe((params: { outbreakId }) => {
                this.outbreakDataService
                    .getOutbreak(params.outbreakId)
                    .subscribe((outbreakData) => {
                        this.outbreak = outbreakData;
                    });
            });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs(breadData: FormModifyQuestionnaireBreadcrumbsData) {
        // determine questionnaire breadcrumb token
        let questionnaireToken: string;
        switch (breadData.type) {
            case OutbreakQestionnaireTypeEnum.CASE:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_CASE_TITLE';
                break;
            case OutbreakQestionnaireTypeEnum.FOLLOW_UP:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_FOLLOW_UP_TITLE';
                break;
            case OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_LAB_RESULT_TITLE';
                break;
        }

        // set breadcrumbs
        this.breadcrumbs = [
            new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '/outbreaks'),
            new BreadcrumbItemModel(
                'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_OUTBREAK_TITLE',
                `/outbreaks/${this.outbreak.id}/view`,
                false,
                {},
                this.outbreak
            ),
            new BreadcrumbItemModel(
                questionnaireToken,
                `/outbreaks/${this.outbreak.id}/${breadData.type}`,
                true
            )
        ];
    }

    /**
     * Replicate can deactivate behaviour
     */
    canDeactivate() {
        return this.questionnaire ? this.questionnaire.canDeactivate() : true;
    }

    /**
     * Update Questionnaire data
     */
    updateQuestionnaire(questionnaireData: FormModifyQuestionnaireUpdateData) {
        this.outbreakDataService
            .modifyOutbreak(questionnaireData.parent.id, {
                [questionnaireData.type]: questionnaireData.questionnaire
            })
            .catch((err) => {
                this.snackbarService.showApiError(err);

                // finished
                questionnaireData.finishSubscriber.next(false);
                questionnaireData.finishSubscriber.complete();

                return ErrorObservable.create(err);
            })
            .switchMap((modifiedOutbreak) => {
                // update language tokens to get the translation of submitted questions and answers
                return this.i18nService.loadUserLanguage()
                    .catch((err) => {
                        this.snackbarService.showApiError(err);

                        // finished
                        questionnaireData.finishSubscriber.next(false);
                        questionnaireData.finishSubscriber.complete();

                        return ErrorObservable.create(err);
                    })
                    .map(() => modifiedOutbreak);
            })
            .subscribe(() => {
                // display message
                // #TODO
                // this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');

                // finished
                questionnaireData.finishSubscriber.next(true);
                questionnaireData.finishSubscriber.complete();
            });
    }
}
