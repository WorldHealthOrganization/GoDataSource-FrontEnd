import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional,
  SkipSelf, ViewChild
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';
import { Constants } from '../../../../core/models/constants';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkDragStart } from '@angular/cdk/drag-drop/drag-events';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { v4 as uuid } from 'uuid';

/**
 * Flatten type
 */
enum FlattenType {
  QUESTION,
  ANSWER
}

/**
 * Flatten node
 */
interface IFlattenNode {
  // required
  id: string;
  type: FlattenType;
  level: number;
  canHaveChildren: boolean;
  data: QuestionModel | AnswerModel;
  parent: IFlattenNode;
  parents: {
    [id: string]: true
  };
  children: IFlattenNode[];
  nonFLat: {
    index: number,
    array: (QuestionModel | AnswerModel)[]
  };
}

@Component({
  selector: 'app-form-edit-questionnaire-v2',
  templateUrl: './app-form-edit-questionnaire-v2.component.html',
  styleUrls: ['./app-form-edit-questionnaire-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormEditQuestionnaireV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormEditQuestionnaireV2Component
  extends AppFormBaseV2<QuestionModel[]> implements OnDestroy {
  // viewport
  @ViewChild('cdkViewport', { static: true }) cdkViewport: CdkVirtualScrollViewport;

  // view only
  @Input() viewOnly: boolean;

  // flattened questions
  flattenedQuestions: IFlattenNode[];

  // invalid drag zone
  private _isInvalidDragEvent: boolean = true;

  // constants
  FlattenType = FlattenType;

  // check if we can drop element to the selected position
  readonly bufferToRender: number = 1024;
  maxBufferPx: number;
  canDrop: (
    index: number,
    drag: CdkDrag,
    drop: CdkDropList
  ) => boolean = (
      index: number,
      drag: CdkDrag
    ): boolean => {
      // determine how much should be visible
      const scrollIndex: number = this.cdkViewport.getRenderedRange().start;

      // make sure we have everything visible
      this.maxBufferPx = this.cdkViewport.measureScrollOffset() + this.bufferToRender;

      // check if allowed
      return drag.data.parent === this.flattenedQuestions[index + scrollIndex].parent;
    };

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
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Set value
   */
  writeValue(value: QuestionModel[]): void {
    // // #TODO
    // value = [];
    // const attach = (where: any[], prefix: string, question: QuestionModel, level: number) => {
    //   where.push(question);
    //   if (level < 5) {
    //     question.answerType = Constants.ANSWER_TYPES.SINGLE_SELECTION.value;
    //     question.answers = [];
    //     for (let i = 0; i < 2; i++) {
    //       const a = new AnswerModel({
    //         label: `${prefix}${question.text}A${i}`
    //       });
    //       question.answers.push(a);
    //
    //       a.additionalQuestions = [];
    //       for (let j = 0; j < 2; j++) {
    //         attach(
    //           a.additionalQuestions,
    //           `${prefix}${question.text}A${i}`,
    //           new QuestionModel({
    //             text: `${prefix}${question.text}A${i}Q${j}`
    //           }),
    //           level + 1
    //         );
    //       }
    //     }
    //   }
    // };
    // for (let i = 0; i < 3; i++) {
    //   attach(
    //     value,
    //     '',
    //     new QuestionModel({
    //       text: `Q${i}`
    //     }),
    //     0
    //   );
    // }

    // set value
    super.writeValue(value);

    // flatten
    this.nonFlatToFlat();
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
      this.value,
      0,
      null,
      {}
    );
  }

  /**
   * Started the drag from a zone that isn't allowed
   */
  notInvalidDragZone(): void {
    this._isInvalidDragEvent = false;
  }

  /**
   * Drop item
   */
  dropItem(event: CdkDragDrop<any[]>): void {
    // reset
    this.maxBufferPx = undefined;

    // drag indexes
    const scrollRange = this.cdkViewport.getRenderedRange();
    const previousIndex: number = event.previousIndex + scrollRange.start;
    const currentIndex: number = event.currentIndex + scrollRange.start;

    // retrieve data
    const node: IFlattenNode = previousIndex > -1 ?
      this.flattenedQuestions[previousIndex] :
      undefined;
    const otherNode: IFlattenNode = currentIndex > -1 ?
      this.flattenedQuestions[currentIndex] :
      undefined;

    // make sure our item is visible
    const scrollToItem = () => {
      // not valid ?
      if (!node) {
        return;
      }

      // scroll
      setTimeout(() => {
        // determine index
        const indexOfMovedItem: number = this.flattenedQuestions.findIndex((item) => item.data === node.data);
        if (indexOfMovedItem > -1) {
          this.cdkViewport.scrollToIndex(indexOfMovedItem);
        }
      });
    };

    // stop ?
    if (this._isInvalidDragEvent) {
      // re-render all
      this.nonFlatToFlat();

      // scroll item
      scrollToItem();

      // finished
      return;
    }

    // disable drag
    this._isInvalidDragEvent = true;

    // nothing changed ?
    if (previousIndex === currentIndex) {
      // re-render all
      this.nonFlatToFlat();

      // scroll item
      scrollToItem();

      // finished
      return;
    }

    // disable drag
    moveItemInArray(
      node.nonFLat.array,
      node.nonFLat.index,
      otherNode.nonFLat.index
    );

    // scroll item
    scrollToItem();

    // flatten
    this.nonFlatToFlat();

    // trigger on change
    this.onChange(this.value);

    // mark dirty
    this.control?.markAsDirty();

    // update ui
    this.detectChanges();
  }

  /**
   * Drag started
   */
  dragStarted(event: CdkDragStart): void {
    // stop drag ?
    if (this._isInvalidDragEvent) {
      document.dispatchEvent(new Event('mouseup'));
    }

    // render only what is necessary
    this.flattenedQuestions = this.flattenedQuestions.filter((item) => item.parent === event.source.data.parent || event.source.data.parents[item.id]);

    // update ui
    this.detectChanges();
  }

  /**
   * Flatten
   */
  private flatten(
    questions: QuestionModel[],
    level: number,
    parent: IFlattenNode,
    parents: {
      [id: string]: true
    }
  ): void {
    // no questions ?
    if (
      !questions ||
      questions.length < 1
    ) {
      return;
    }

    // go through each question
    questions.forEach((question, questionIndex) => {
      // flatten
      const flattenedQuestion: IFlattenNode = {
        id: uuid(),
        type: FlattenType.QUESTION,
        level,
        canHaveChildren: question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
          question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value,
        data: question,
        parent,
        parents,
        children: [],
        nonFLat: {
          index: questionIndex,
          array: questions
        }
      };

      // add to list
      this.flattenedQuestions.push(flattenedQuestion);

      // add to children list
      if (parent) {
        parent.children.push(flattenedQuestion);
      }

      // attach answers if we have any
      if (flattenedQuestion.canHaveChildren) {
        (question.answers || []).forEach((answer, answerIndex) => {
          // flatten
          const flattenedAnswer: IFlattenNode = {
            id: uuid(),
            type: FlattenType.ANSWER,
            level: level + 1,
            canHaveChildren: answer.additionalQuestionsShow,
            data: answer,
            parent: flattenedQuestion,
            parents: {
              ...flattenedQuestion.parents,
              [flattenedQuestion.id]: true
            },
            children: [],
            nonFLat: {
              index: answerIndex,
              array: question.answers
            }
          };

          // add to list
          this.flattenedQuestions.push(flattenedAnswer);

          // add to children list
          flattenedQuestion.children.push(flattenedAnswer);

          // check for children questions
          if (flattenedAnswer.canHaveChildren) {
            this.flatten(
              answer.additionalQuestions,
              level + 2,
              flattenedAnswer,
              {
                ...flattenedAnswer.parents,
                [flattenedAnswer.id]: true
              }
            );
          }
        });
      }
    });
  }
}
