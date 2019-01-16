import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { FormModifyQuestionnaireBreadcrumbsData, FormModifyQuestionnaireUpdateData } from '../../../../shared/components';
import { OutbreakQestionnaireTypeEnum } from '../../../../core/enums/outbreak-qestionnaire-type.enum';

@Component({
    selector: 'app-outbreak-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-questionnaire.component.html',
    styleUrls: ['./outbreak-questionnaire.component.less']
})
export class OutbreakQuestionnaireComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // outbreak to modify
    outbreak: OutbreakModel = new OutbreakModel();

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute
    ) {}

    /**
     * Initialized
     */
    ngOnInit() {
        // get outbreak
        this.outbreak = this.route.snapshot.data.outbreak;
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
     * Update Questionnaire data
     */
    updateQuestionnaire(questionnaireData: FormModifyQuestionnaireUpdateData) {
        console.log('updateQuestionnaire', questionnaireData);
        setTimeout(() => {
            questionnaireData.finishSubscriber.next(true);
        }, 2000);
    }
}
