import { ChangeDetectorRef, Component, forwardRef, Host, HostListener, Input, OnDestroy, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAnswerData, QuestionModel } from '../../../../core/models/question.model';
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
    this.nonFlatToFlat();
  }

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

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
   * Re-render UI
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Convert non flat value to flat value
   */
  private nonFlatToFlat(): void {
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
        oneParentIsInactive
      };

      // add to list
      this.flattenedQuestions.push(flattenedQuestion);

      // attach answers if we have any
      if (
        (
          question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
          question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value
        ) &&
        question.answers?.length > 0
      ) {
        // go through answers and determine how we should render them
        let atLeastOneChildHasQuestions: boolean = false;
        question.answers.forEach((answer) => {
          // translate
          answer.label = answer.label ?
            this.translateService.instant(answer.label) :
            answer.label;

          // determine if children have questions
          if (answer.additionalQuestions?.length > 0) {
            atLeastOneChildHasQuestions = true;
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
            definition: question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ?
              {
                type: FlattenAnswerDrawType.SINGLE_SELECT,
                options
              } : {
                type: FlattenAnswerDrawType.MULTIPLE_SELECT,
                options
              }
          };

          // add to list
          this.flattenedQuestions.push(flattenedAnswer);
        } else {
          // #TODO
          // no child questions so we can display either radio-buttons or checkboxes
        }

        // // check for children questions
        // this.flatten(
        //   answer.additionalQuestions,
        //   flattenedAnswer.level + 1,
        //   flattenedAnswer,
        //   flattenedAnswer.oneParentIsInactive
        // );

      } else if (question.answerType !== Constants.ANSWER_TYPES.MARKUP.value) {
        // // simple answer - text, number...date
        // const flattenedAnswer: IFlattenNodeAnswer = {
        //   type: FlattenType.ANSWER,
        //   level: flattenedQuestion.level + 1,
        //   data: null,
        //   parent: flattenedQuestion,
        //   oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive
        // };
        //
        // // add to list
        // this.flattenedQuestions.push(flattenedAnswer);
      }
    });
  }

  // /**
  //  * Update questionnaire
  //  */
  // updateQuestionnaire(
  //   item: IFlattenNodeAnswer,
  //   index: number,
  //   value: any
  // ): void {
  //   // update questionnaire
  //   this.nonFlatToFlat();
  // }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();
  }
}
