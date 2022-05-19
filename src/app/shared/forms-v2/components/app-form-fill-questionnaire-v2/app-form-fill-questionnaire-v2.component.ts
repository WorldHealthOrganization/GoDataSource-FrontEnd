import { ChangeDetectorRef, Component, forwardRef, Host, HostListener, Input, OnDestroy, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AnswerModel, IAnswerData, QuestionModel } from '../../../../core/models/question.model';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
import { Constants } from '../../../../core/models/constants';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';

/**
 * Flatten type
 */
enum FlattenType {
  QUESTION,
  ANSWER
}

/**
 * Answer draw type
 */
enum FlattenAnswerDrawType {
  SINGLE_SELECT,
  RADIO_BUTTON,
  MULTIPLE_SELECT,
  CHECKBOX,
  TEXT,
  DATE,
  NUMBER,
  FILE
}

/**
 * Flatten node answer draw 0 single select
 */
interface IFlattenNodeAnswerDrawSingleSelect {
  type: FlattenAnswerDrawType.SINGLE_SELECT;
  options: ILabelValuePairModel[];
}

/**
 * Flatten node answer draw - multiple select
 */
interface IFlattenNodeAnswerDrawMultipleSelect {
  type: FlattenAnswerDrawType.MULTIPLE_SELECT;
  options: ILabelValuePairModel[];
}

/**
 * Flatten node answer
 */
interface IFlattenNodeAnswer {
  // required
  type: FlattenType.ANSWER;
  level: number;
  parent: IFlattenNodeQuestion;
  oneParentIsInactive: boolean;
  definition: IFlattenNodeAnswerDrawSingleSelect | IFlattenNodeAnswerDrawMultipleSelect;
}

/**
 * Flatten node question
 */
interface IFlattenNodeQuestion {
  // required
  type: FlattenType.QUESTION;
  level: number;
  parent: IFlattenNodeAnswer;
  data: QuestionModel;
  oneParentIsInactive: boolean;
  canCollapseOrExpand: boolean;
}

@Component({
  selector: 'app-form-fill-questionnaire-v2',
  templateUrl: './app-form-fill-questionnaire-v2.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormFillQuestionnaireV2Component),
    multi: true
  }]
})
export class AppFormFillQuestionnaireV2Component
  extends AppFormBaseV2<{
    [variable: string]: IAnswerData[];
  }> implements OnDestroy {

  // viewport
  @ViewChild('cdkViewport') cdkViewport: CdkVirtualScrollViewport;

  // selected tab change
  // - hack fix for virtual scroll problem
  @Input() set selectedTab(selected: boolean) {
    if (
      selected &&
      this.cdkViewport
    ) {
      this.cdkViewport.scrollToIndex(0);
      this.cdkViewport.checkViewportSize();
    }
  }

  // view only
  @Input() viewOnly: boolean;

  // questionnaire
  private _questionnaire: QuestionModel[];
  @Input() set questionnaire(questionnaire: QuestionModel[]) {
    // set data
    this._questionnaire = questionnaire;

    // flatten
    this.nonFlatToFlat(false);
  }

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // handlers
  private _nonFlatToFlatWait: any;

  // flattened questions
  flattenedQuestions: (IFlattenNodeQuestion | IFlattenNodeAnswer)[] = [];

  // constants
  FlattenType = FlattenType;
  Constants = Constants;
  FlattenAnswerDrawType = FlattenAnswerDrawType;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // parent
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );

    // update render mode
    this.updateRenderMode();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Write value and construct questionnaire
   */
  writeValue(value: { [p: string]: IAnswerData[] }): void {
    // initialize value if necessary
    if (!value) {
      value = {};
    }

    // set value
    super.writeValue(value);

    // flatten
    this.nonFlatToFlat(false);
  }

  /**
   * Re-render UI
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Convert non flat value to flat value
   */
  private nonFlatToFlat(waited: boolean): void {
    // wait for everything to be bound
    if (
      !this.value ||
      !this._questionnaire
    ) {
      return;
    }

    // wait so we don't execute multiple times
    if (!waited) {
      // stop previous timeout
      if (this._nonFlatToFlatWait) {
        clearTimeout(this._nonFlatToFlatWait);
        this._nonFlatToFlatWait = undefined;
      }

      // wait
      this._nonFlatToFlatWait = setTimeout(() => {
        // clear timeout
        this._nonFlatToFlatWait = undefined;

        // execute
        this.nonFlatToFlat(true);
      });

      // finished
      return;
    }

    // flatten
    this.flattenedQuestions = [];
    this.flatten(
      this._questionnaire,
      0,
      null,
      false
    );
  }

  /**
   * Flatten
   */
  private flatten(
    questions: QuestionModel[],
    level: number,
    parent: IFlattenNodeAnswer,
    oneParentIsInactive: boolean
  ): void {
    // no questions ?
    if (
      !questions ||
      questions.length < 1
    ) {
      return;
    }

    // go through each question
    questions.forEach((question) => {
      // translate
      question.text = question.text ?
        this.translateService.instant(question.text) :
        question.text;

      // flatten
      const flattenedQuestion: IFlattenNodeQuestion = {
        type: FlattenType.QUESTION,
        level,
        data: question,
        parent,
        oneParentIsInactive,
        canCollapseOrExpand: question.answers?.length > 0
      };

      // add to list
      this.flattenedQuestions.push(flattenedQuestion);

      // collapsed ?
      if (!question.collapsed) {
        // process question type
        switch (question.answerType) {
          case Constants.ANSWER_TYPES.SINGLE_SELECTION.value:
          case Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value:
            // attach answers if we have any
            if (question.answers?.length > 0) {
              // go through answers and determine how we should render them
              let atLeastOneChildHasQuestions: boolean = false;
              const answersWithQuestionsMap: {
                [answerKey: string]: AnswerModel
              } = {};
              question.answers.forEach((answer) => {
                // translate
                answer.label = answer.label ?
                  this.translateService.instant(answer.label) :
                  answer.label;

                // determine if children have questions
                if (answer.additionalQuestions?.length > 0) {
                  // we have children questions
                  atLeastOneChildHasQuestions = true;

                  // map for easy access later
                  answersWithQuestionsMap[answer.value] = answer;
                }
              });

              // at least one answer has children questions ?
              if (atLeastOneChildHasQuestions) {
                // map options
                const options: ILabelValuePairModel[] = question.answers.map((answer) => ({
                  label: answer.label,
                  value: answer.value
                }));

                // flatten
                const flattenedAnswer: IFlattenNodeAnswer = {
                  type: FlattenType.ANSWER,
                  level: flattenedQuestion.level + 1,
                  parent: flattenedQuestion,
                  oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
                  definition: question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value ?
                    {
                      type: FlattenAnswerDrawType.MULTIPLE_SELECT,
                      options
                    } : {
                      type: FlattenAnswerDrawType.SINGLE_SELECT,
                      options
                    }
                };

                // initialize value if necessary too
                if (
                  !this.value[flattenedQuestion.data.variable] ||
                  this.value[flattenedQuestion.data.variable].length < 1
                ) {
                  this.value[flattenedQuestion.data.variable] = [{
                    value: question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value ?
                      [] :
                      undefined
                  }];
                }

                // add to list
                this.flattenedQuestions.push(flattenedAnswer);

                // determine if we need to show other things depending on what was selected
                this.value[flattenedQuestion.data.variable].forEach((item) => {
                  // multiple answer question ?
                  if (question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) {
                    // go through each multiple response
                    if (item.value?.length > 0) {
                      item.value.forEach((answerValue: string) => {
                        if (answersWithQuestionsMap[answerValue]) {
                          // flatten children questions
                          this.flatten(
                            answersWithQuestionsMap[answerValue].additionalQuestions,
                            flattenedAnswer.level + 1,
                            flattenedAnswer,
                            flattenedAnswer.oneParentIsInactive
                          );
                        }
                      });
                    }
                  } else {
                    if (answersWithQuestionsMap[item.value]) {
                      // flatten children questions
                      this.flatten(
                        answersWithQuestionsMap[item.value].additionalQuestions,
                        flattenedAnswer.level + 1,
                        flattenedAnswer,
                        flattenedAnswer.oneParentIsInactive
                      );
                    }
                  }
                });
              } else {
                // #TODO
                // no child questions so we can display either radio-buttons or checkboxes
              }
            }

            // finished
            break;

          case Constants.ANSWER_TYPES.FREE_TEXT.value:
            // #TODO
            // console.log('free');

            // finished
            break;

          case Constants.ANSWER_TYPES.NUMERIC.value:
            // #TODO
            // console.log('num');

            // finished
            break;

          case Constants.ANSWER_TYPES.DATE_TIME.value:
            // #TODO
            // console.log('date');

            // finished
            break;

          case Constants.ANSWER_TYPES.FILE_UPLOAD.value:
            // #TODO
            // console.log('file');

            // finished
            break;

            // markup nothing to do
            // NOTHING
        }
      }
    });
  }

  /**
   * Update questionnaire
   */
  answersChanged(): void {
    // update questionnaire
    this.nonFlatToFlat(true);
  }

  /**
   * Expand collapse
   */
  expandCollapse(item: IFlattenNodeQuestion): void {
    // can't collapse or expand
    if (!item.canCollapseOrExpand) {
      return;
    }

    // expand / collapse
    if (item.data.collapsed) {
      delete item.data.collapsed;
    } else {
      item.data.collapsed = true;
    }

    // redraw
    this.nonFlatToFlat(true);
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();
  }
}
