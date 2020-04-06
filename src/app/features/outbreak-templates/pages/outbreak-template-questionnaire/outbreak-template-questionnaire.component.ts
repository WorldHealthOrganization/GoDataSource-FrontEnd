import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { FormModifyQuestionnaireBreadcrumbsData, FormModifyQuestionnaireComponent, FormModifyQuestionnaireUpdateData } from '../../../../shared/components';
import { OutbreakQestionnaireTypeEnum } from '../../../../core/enums/outbreak-qestionnaire-type.enum';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';

@Component({
    selector: 'app-outbreak-template-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-template-questionnaire.component.html',
    styleUrls: ['./outbreak-template-questionnaire.component.less']
})
export class OutbreakTemplateQuestionnaireComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    UserSettings = UserSettings;

    // authenticated user
    authUser: UserModel;

    // outbreak to modify
    outbreakTemplate: OutbreakTemplateModel;

    // List table visible columns
    visibleTableColumns: {
        [column: string]: boolean
    } = {};

    // List table columns
    tableColumns: VisibleColumnModel[] = [
        new VisibleColumnModel({
            field: 'displayOrder',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ORDER'
        }),
        new VisibleColumnModel({
            field: 'text',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TEXT'
        }),
        new VisibleColumnModel({
            field: 'answerType',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWER_TYPE'
        }),
        new VisibleColumnModel({
            field: 'variable',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_VARIABLE'
        }),
        new VisibleColumnModel({
            field: 'category',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_CATEGORY'
        }),
        new VisibleColumnModel({
            field: 'answersDisplay',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWERS_DISPLAY'
        }),
        new VisibleColumnModel({
            field: 'nestedQuestions',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_NESTED_QUESTIONS'
        }),
        new VisibleColumnModel({
            field: 'required',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_REQUIRED'
        }),
        new VisibleColumnModel({
            field: 'multiAnswer',
            label: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_MULTI_ANSWER'
        })
    ];

    /**
     * Questionnaire
     */
    @ViewChild('questionnaire') questionnaire: FormModifyQuestionnaireComponent;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private outbreakTemplateDataService: OutbreakTemplateDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        private authDataService: AuthDataService
    ) {
        super();
    }

    /**
     * Initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get outbreak
        this.route.params
            .subscribe((params: { outbreakTemplateId }) => {
                this.outbreakTemplateDataService
                    .getOutbreakTemplate(params.outbreakTemplateId)
                    .subscribe((outbreakTemplateData) => {
                        this.outbreakTemplate = outbreakTemplateData;
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs(breadData: FormModifyQuestionnaireBreadcrumbsData) {
        // determine questionnaire breadcrumb token
        let questionnaireToken: string;
        switch (breadData.type) {
            case OutbreakQestionnaireTypeEnum.CASE:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_CASE_TITLE';
                break;
            case OutbreakQestionnaireTypeEnum.FOLLOW_UP:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_FOLLOW_UP_TITLE';
                break;
            case OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT:
                questionnaireToken = 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_LAB_RESULT_TITLE';
                break;
        }

        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (OutbreakTemplateModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '/outbreak-templates')
            );
        }

        // add view breadcrumb only if we have permission
        if (OutbreakTemplateModel.canView(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_OUTBREAK_TITLE',
                    `/outbreak-templates/${this.outbreakTemplate.id}/view`,
                    false,
                    {},
                    this.outbreakTemplate
                )
            );
        }

        // add active bread
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                questionnaireToken,
                `/outbreak-templates/${this.outbreakTemplate.id}/${breadData.type}`,
                true
            )
        );
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
        this.outbreakTemplateDataService
            .modifyOutbreakTemplate(questionnaireData.parent.id, {
                [questionnaireData.type]: questionnaireData.questionnaire
            })
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // finished
                    questionnaireData.finishSubscriber.next(false);
                    questionnaireData.finishSubscriber.complete();

                    return throwError(err);
                }),
                switchMap((modifiedOutbreak) => {
                    // update language tokens to get the translation of submitted questions and answers
                    return this.i18nService.loadUserLanguage()
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);

                                // finished
                                questionnaireData.finishSubscriber.next(false);
                                questionnaireData.finishSubscriber.complete();

                                return throwError(err);
                            }),
                            map(() => modifiedOutbreak)
                        );
                })
            )
            .subscribe(() => {
                // display message - this might flood the user, so for now we won't display anything
                // #TODO
                // this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');

                // finished
                questionnaireData.finishSubscriber.next(true);
                questionnaireData.finishSubscriber.complete();
            });
    }


    /**
     * Visible columns
     */
    applySideColumnsChanged(visibleColumns: string[]) {
        this.visibleTableColumns = {};
        (visibleColumns || []).forEach((column) => {
            this.visibleTableColumns[column] = true;
        });
    }
}
