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
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkDragStart } from '@angular/cdk/drag-drop/drag-events';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

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
  type: FlattenType;
  level: number;
  canHaveChildren: boolean;
  data: QuestionModel | AnswerModel;
  parent: IFlattenNode;
  children: IFlattenNode[];
  deepChildrenCount: number;

  // optional
  hide?: boolean;
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
  canDrop: (
    index: number,
    drag: CdkDrag,
    drop: CdkDropList
  ) => boolean = (
      index: number,
      drag: CdkDrag
    ): boolean => {
      return drag.data.parent === this.flattenedQuestions[index + this.cdkViewport.getRenderedRange().start].parent;
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
    this.flattenedQuestions = [];
    const flatten = (
      questions: QuestionModel[],
      level: number,
      parent: IFlattenNode
    ): number => {
      // no questions ?
      if (
        !questions ||
        questions.length < 1
      ) {
        return 0;
      }

      // go through each question
      let counted: number = 0;
      questions.forEach((question) => {
        // flatten
        const flattenedQuestion: IFlattenNode = {
          type: FlattenType.QUESTION,
          level,
          canHaveChildren: question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
            question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value,
          data: question,
          parent,
          children: [],
          deepChildrenCount: 0
        };

        // count
        counted++;

        // add to list
        this.flattenedQuestions.push(flattenedQuestion);

        // add to children list
        if (parent) {
          parent.children.push(flattenedQuestion);
        }

        // attach answers if we have any
        if (flattenedQuestion.canHaveChildren) {
          (question.answers || []).forEach((answer) => {
            // flatten
            const flattenedAnswer: IFlattenNode = {
              type: FlattenType.ANSWER,
              level: level + 1,
              canHaveChildren: answer.additionalQuestionsShow,
              data: answer,
              parent: flattenedQuestion,
              children: [],
              deepChildrenCount: 0
            };

            // count
            counted++;
            flattenedQuestion.deepChildrenCount++;

            // add to list
            this.flattenedQuestions.push(flattenedAnswer);

            // add to children list
            flattenedQuestion.children.push(flattenedAnswer);

            // check for children questions
            if (flattenedAnswer.canHaveChildren) {
              // update count
              flattenedAnswer.deepChildrenCount = flatten(
                answer.additionalQuestions,
                level + 2,
                flattenedAnswer
              );

              // count
              counted += flattenedAnswer.deepChildrenCount;
              flattenedQuestion.deepChildrenCount += flattenedAnswer.deepChildrenCount;
            }
          });
        }
      });

      // finished
      return counted;
    };

    // flatten
    flatten(
      this.value,
      0,
      null
    );
  }

  /**
   * Re-render UI
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
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
    // show children once again
    this.showHideChildrenDivs(
      event.item.data,
      true
    );

    // stop ?
    if (this._isInvalidDragEvent) {
      return;
    }

    // disable drag
    this._isInvalidDragEvent = true;

    // drag indexes
    const scrollRange = this.cdkViewport.getRenderedRange();
    const previousIndex: number = event.previousIndex + scrollRange.start;
    const currentIndex: number = event.currentIndex + scrollRange.start;

    // nothing changed ?
    if (previousIndex === currentIndex) {
      return;
    }

    // retrieve data
    const node: IFlattenNode = this.flattenedQuestions[previousIndex];
    const otherNode: IFlattenNode = this.flattenedQuestions[currentIndex];

    // create a new flattened array to copy data
    const newFlattenedQuestions: IFlattenNode[] = [];

    // start copying proper items
    if (previousIndex > currentIndex) {
      // copy items
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(0, currentIndex));
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(previousIndex, previousIndex + node.deepChildrenCount + 1));
      this.flattenedQuestions.splice(previousIndex, node.deepChildrenCount + 1);
      this.flattenedQuestions.splice(0, currentIndex);
      newFlattenedQuestions.push(...this.flattenedQuestions);
    } else {
      // copy items
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(0, previousIndex));
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(previousIndex + node.deepChildrenCount + 1, currentIndex + otherNode.deepChildrenCount + 1));
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(previousIndex, previousIndex + node.deepChildrenCount + 1));
      newFlattenedQuestions.push(...this.flattenedQuestions.slice(currentIndex + otherNode.deepChildrenCount + 1));
    }

    // update list
    this.flattenedQuestions = newFlattenedQuestions;

    // #TODO
    // update tree of questions

    // #TODO
    // // trigger items changed
    // if (input.itemsChanged) {
    //   input.itemsChanged(input);
    // }

    // #TODO
    // // mark list as dirty
    // this.markArrayItemsAsDirty(
    //   form,
    //   input.name
    // );

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

    // go through children and make them invisible
    this.showHideChildrenDivs(
      event.source.data,
      false
    );
  }

  /**
   * Show / Hide children divs
   */
  private showHideChildrenDivs(
    parent: IFlattenNode,
    show: boolean
  ): void {
    // change hide value
    const updateHideProp = (children: IFlattenNode[]) => {
      // nothing to update ?
      if (
        !children ||
        children.length < 1
      ) {
        return;
      }

      // update
      children.forEach((child) => {
        // update
        child.hide = !show;

        // check children
        updateHideProp(child.children);
      });
    };

    // update
    updateHideProp(parent.children);
  }
}
