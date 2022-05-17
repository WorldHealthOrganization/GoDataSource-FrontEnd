import { ChangeDetectorRef, Component, forwardRef, Host, HostListener, Input, OnDestroy, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAnswerData, QuestionModel } from '../../../../core/models/question.model';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
//
// /**
//  * Flatten type
//  */
// enum FlattenType {
//   QUESTION,
//   ANSWER
// }
//
/**
 * Flatten node
 */
// interface IFlattenNode {
//   required
//   id: string;
//   type: FlattenType;
//   level: number;
//   canHaveChildren: boolean;
//   data: QuestionModel | AnswerModel;
//   parent: IFlattenNode;
//   parents: {
//     [id: string]: true
//   };
//   children: IFlattenNode[];
//   nonFLat: {
//     index: number,
//     array: (QuestionModel | AnswerModel)[]
//   };
// }

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

  // view only
  @Input() viewOnly: boolean;

  // questionnaire
  @Input() questionnaire: QuestionModel[];

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // flattened questions
  // flattenedQuestions: IFlattenNode[];

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

  // /**
  //  * Set value
  //  */
  // writeValue(value: QuestionModel[]): void {
  //   // set value
  //   super.writeValue(value);
  //
  //   // flatten
  //   this.nonFlatToFlat();
  // }

  /**
   * Re-render UI
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  // /**
  //  * Convert non flat value to flat value
  //  */
  // private nonFlatToFlat(): void {
  //   // flatten
  //   this.flattenedQuestions = [];
  //   this.flatten(
  //     this.value,
  //     0,
  //     null,
  //     {}
  //   );
  // }

  /**
   * Flatten
   */
  // private flatten(
  //   questions: QuestionModel[],
  //   level: number,
  //   parent: IFlattenNode,
  //   parents: {
  //     [id: string]: true
  //   }
  // ): void {
  //   // no questions ?
  //   if (
  //     !questions ||
  //     questions.length < 1
  //   ) {
  //     return;
  //   }
  //
  //   // go through each question
  //   questions.forEach((question, questionIndex) => {
  //     // translate
  //     question.text = question.text ?
  //       this.translateService.instant(question.text) :
  //       question.text;
  //
  //     // set order
  //     question.order = questionIndex;
  //
  //     // flatten
  //     const flattenedQuestion: IFlattenNode = {
  //       id: uuid(),
  //       type: FlattenType.QUESTION,
  //       level,
  //       canHaveChildren: question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
  //         question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value,
  //       data: question,
  //       parent,
  //       parents,
  //       children: [],
  //       nonFLat: {
  //         index: questionIndex,
  //         array: questions
  //       }
  //     };
  //
  //     // add to list
  //     this.flattenedQuestions.push(flattenedQuestion);
  //
  //     // add to children list
  //     if (parent) {
  //       parent.children.push(flattenedQuestion);
  //     }
  //
  //     // attach answers if we have any
  //     if (flattenedQuestion.canHaveChildren) {
  //       (question.answers || []).forEach((answer, answerIndex) => {
  //         // translate
  //         answer.label = answer.label ?
  //           this.translateService.instant(answer.label) :
  //           answer.label;
  //
  //         // set order
  //         answer.order = answerIndex;
  //
  //         // flatten
  //         const flattenedAnswer: IFlattenNode = {
  //           id: uuid(),
  //           type: FlattenType.ANSWER,
  //           level: flattenedQuestion.level + 1,
  //           canHaveChildren: true,
  //           data: answer,
  //           parent: flattenedQuestion,
  //           parents: {
  //             ...flattenedQuestion.parents,
  //             [flattenedQuestion.id]: true
  //           },
  //           children: [],
  //           nonFLat: {
  //             index: answerIndex,
  //             array: question.answers
  //           }
  //         };
  //
  //         // add to list
  //         this.flattenedQuestions.push(flattenedAnswer);
  //
  //         // add to children list
  //         flattenedQuestion.children.push(flattenedAnswer);
  //
  //         // check for children questions
  //         if (flattenedAnswer.canHaveChildren) {
  //           this.flatten(
  //             answer.additionalQuestions,
  //             flattenedAnswer.level + 1,
  //             flattenedAnswer,
  //             {
  //               ...flattenedAnswer.parents,
  //               [flattenedAnswer.id]: true
  //             }
  //           );
  //         }
  //       });
  //     }
  //   });
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
