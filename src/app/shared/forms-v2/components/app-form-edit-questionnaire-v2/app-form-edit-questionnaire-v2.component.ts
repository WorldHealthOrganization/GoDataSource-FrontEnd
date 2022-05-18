import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Host, HostListener, Input, OnDestroy, Optional, SkipSelf, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';
import { Constants } from '../../../../core/models/constants';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkDragStart } from '@angular/cdk/drag-drop/drag-events';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { v4 as uuid } from 'uuid';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import {
  IV2SideDialogConfigButton,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogConfigInputText,
  IV2SideDialogConfigInputTextarea,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../../../components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';

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
  oneParentIsInactive: boolean;
  children: IFlattenNode[];
  nonFLat: {
    index: number,
    array: (QuestionModel | AnswerModel)[]
  };
  canCollapseOrExpand: boolean;
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormEditQuestionnaireV2Component
  extends AppFormBaseV2<QuestionModel[]> implements OnDestroy {
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

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // flattened questions
  flattenedQuestions: IFlattenNode[];

  // invalid drag zone
  private _isInvalidDragEvent: boolean = true;

  // constants
  FlattenType = FlattenType;
  RenderMode = RenderMode;
  Constants = Constants;

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
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service,
    protected activatedRoute: ActivatedRoute,
    protected formHelperService: FormHelperService
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
   * Set value
   */
  writeValue(value: QuestionModel[]): void {
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
      {},
      false
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

    // stop ?
    if (this._isInvalidDragEvent) {
      // re-render all
      this.nonFlatToFlat();

      // scroll item
      this.scrollToItem(node?.data);

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
      this.scrollToItem(node?.data);

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
    this.scrollToItem(node?.data);

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
    },
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
    questions.forEach((question, questionIndex) => {
      // translate
      question.text = question.text ?
        this.translateService.instant(question.text) :
        question.text;

      // set order
      question.order = questionIndex;

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
        oneParentIsInactive,
        children: [],
        nonFLat: {
          index: questionIndex,
          array: questions
        },
        canCollapseOrExpand: question.answers?.length > 0
      };

      // add to list
      this.flattenedQuestions.push(flattenedQuestion);

      // add to children list
      if (parent) {
        parent.children.push(flattenedQuestion);
      }

      // attach answers if we have any
      if (
        flattenedQuestion.canHaveChildren &&
        !question.collapsed
      ) {
        (question.answers || []).forEach((answer, answerIndex) => {
          // translate
          answer.label = answer.label ?
            this.translateService.instant(answer.label) :
            answer.label;

          // set order
          answer.order = answerIndex;

          // flatten
          const flattenedAnswer: IFlattenNode = {
            id: uuid(),
            type: FlattenType.ANSWER,
            level: flattenedQuestion.level + 1,
            canHaveChildren: true,
            data: answer,
            parent: flattenedQuestion,
            parents: {
              ...flattenedQuestion.parents,
              [flattenedQuestion.id]: true
            },
            oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
            children: [],
            nonFLat: {
              index: answerIndex,
              array: question.answers
            },
            canCollapseOrExpand: answer.additionalQuestions?.length > 0
          };

          // add to list
          this.flattenedQuestions.push(flattenedAnswer);

          // add to children list
          flattenedQuestion.children.push(flattenedAnswer);

          // check for children questions
          if (
            flattenedAnswer.canHaveChildren &&
            !answer.collapsed
          ) {
            this.flatten(
              answer.additionalQuestions,
              flattenedAnswer.level + 1,
              flattenedAnswer,
              {
                ...flattenedAnswer.parents,
                [flattenedAnswer.id]: true
              },
              flattenedAnswer.oneParentIsInactive
            );
          }
        });
      }
    });
  }

  /**
   * Make sure our item is visible
   */
  private scrollToItem(scrollToItem: QuestionModel | AnswerModel): void {
    // not valid ?
    if (!scrollToItem) {
      return;
    }

    // scroll
    setTimeout(() => {
      // determine index
      const indexOfMovedItem: number = this.flattenedQuestions.findIndex((item) => item.data === scrollToItem);
      if (
        this.cdkViewport &&
        indexOfMovedItem > -1
      ) {
        this.cdkViewport.scrollToIndex(indexOfMovedItem);
      }
    });
  }

  /**
   * Show add / modify dialog - question
   */
  private showAddModifyQuestion(
    add: boolean,
    parent: AnswerModel,
    modifyQuestion: QuestionModel
  ): void {
    // construct array of inputs
    let variableManuallyChanged: boolean = false;
    const inputs: V2SideDialogConfigInput[] = [];

    // determine current question variables
    const usedVariables: {
      [variable: string]: true
    } = {};
    this.flattenedQuestions.forEach((item) => {
      // not important ?
      if (
        item.type === FlattenType.ANSWER ||
        item.data === modifyQuestion ||
        !(item.data as QuestionModel).variable
      ) {
        return;
      }

      // remember variable
      usedVariables[(item.data as QuestionModel).variable.toLowerCase()] = true;
    });

    // details ?
    if (add) {
      inputs.push({
        type: V2SideDialogConfigInputType.HTML,
        name: 'details',
        cssClasses: 'gd-form-edit-questionnaire-v2-details',
        placeholder: this.translateService.instant(
          'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_DETAILS', {
            details: parent ?
              parent.label :
              '-'
          }
        )
      });
    }

    // on view only we should display data differently
    if (this.viewOnly) {
      // inputs
      inputs.push(
        // text
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'text',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TEXT',
          value: modifyQuestion.text
        },

        // answer type
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'answerType',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWER_TYPE',
          value: modifyQuestion.answerType
        },

        // variable
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'variable',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_VARIABLE',
          value: modifyQuestion.variable,
          visible: () => modifyQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value
        },

        // category
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'category',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_CATEGORY',
          value: modifyQuestion.category
        },

        // answer display
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'answersDisplay',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWERS_DISPLAY',
          value: modifyQuestion.answersDisplay,
          visible: () => modifyQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value
        },

        // inactive
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'inactive',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_INACTIVE',
          value: modifyQuestion.inactive ?
            'LNG_COMMON_LABEL_YES' :
            'LNG_COMMON_LABEL_NO'
        },

        // required
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'required',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_REQUIRED',
          value: modifyQuestion.required ?
            'LNG_COMMON_LABEL_YES' :
            'LNG_COMMON_LABEL_NO',
          visible: () => modifyQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value
        },

        // multi answer
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'multiAnswer',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_MULTI_ANSWER',
          value: modifyQuestion.multiAnswer ?
            'LNG_COMMON_LABEL_YES' :
            'LNG_COMMON_LABEL_NO',
          visible: () => !parent && modifyQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value
        }
      );
    } else {
      // inputs
      inputs.push(
        // text
        {
          type: V2SideDialogConfigInputType.TEXTAREA,
          name: 'text',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TEXT',
          value: modifyQuestion ?
            modifyQuestion.text :
            '',
          validators: {
            required: () => true
          },
          change: (data) => {
            // nothing to do ?
            const text: string = (data.map.text as IV2SideDialogConfigInputTextarea).value?.trim();
            if (
              modifyQuestion ||
              !text ||
              variableManuallyChanged
            ) {
              return;
            }

            // update variable if question is new
            (data.map.variable as IV2SideDialogConfigInputText).value = _.snakeCase(text);
          }
        },

        // answer type
        {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          name: 'answerType',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWER_TYPE',
          value: modifyQuestion ?
            modifyQuestion.answerType :
            '',
          options: (this.activatedRoute.snapshot.data.questionnaireAnswerType as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          validators: {
            required: () => true
          }
        },

        // variable
        {
          type: V2SideDialogConfigInputType.TEXT,
          name: 'variable',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_VARIABLE',
          value: modifyQuestion ?
            modifyQuestion.variable :
            '',
          visible: (data) => (data.map.answerType as IV2SideDialogConfigInputSingleDropdown).value !== Constants.ANSWER_TYPES.MARKUP.value,
          disabled: () => !!modifyQuestion,
          validators: {
            required: () => true,
            notNumber: () => !modifyQuestion,
            notInObject: () => ({
              values: usedVariables,
              err: 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_DUPLICATE_VARIABLE'
            })
          },
          change: () => {
            variableManuallyChanged = true;
          }
        },

        // category
        {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          name: 'category',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_CATEGORY',
          value: modifyQuestion ?
            modifyQuestion.category :
            '',
          options: (this.activatedRoute.snapshot.data.questionnaireQuestionCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          validators: {
            required: () => true
          }
        },

        // answer display
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_ANSWERS_DISPLAY',
          visible: (data) => (data.map.answerType as IV2SideDialogConfigInputSingleDropdown).value !== Constants.ANSWER_TYPES.MARKUP.value
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE,
          name: 'answersDisplay',
          value: modifyQuestion ?
            modifyQuestion.answersDisplay :
            Constants.ANSWERS_DISPLAY.VERTICAL.value,
          options: (this.activatedRoute.snapshot.data.questionnaireAnswerDisplay as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          visible: (data) => (data.map.answerType as IV2SideDialogConfigInputSingleDropdown).value !== Constants.ANSWER_TYPES.MARKUP.value
        },

        // inactive & required & multi answer
        {
          type: V2SideDialogConfigInputType.ROW,
          name: 'inactive_required_multi_answer',
          inputs: [
            // inactive
            {
              type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
              name: 'inactive',
              placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_INACTIVE',
              value: modifyQuestion ?
                modifyQuestion.inactive :
                false
            },

            // required
            {
              type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
              name: 'required',
              placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_REQUIRED',
              value: modifyQuestion ?
                modifyQuestion.required :
                false,
              visible: (data) => (data.map.answerType as IV2SideDialogConfigInputSingleDropdown).value !== Constants.ANSWER_TYPES.MARKUP.value
            },

            // multi answer
            {
              type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
              name: 'multiAnswer',
              placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_MULTI_ANSWER',
              value: modifyQuestion ?
                modifyQuestion.multiAnswer :
                false,
              visible: (data) => !parent && (data.map.answerType as IV2SideDialogConfigInputSingleDropdown).value !== Constants.ANSWER_TYPES.MARKUP.value
            }
          ]
        }
      );
    }

    // buttons
    const bottomButtons: IV2SideDialogConfigButton[] = [];

    // save
    if (!this.viewOnly) {
      bottomButtons.push({
        type: IV2SideDialogConfigButtonType.OTHER,
        label: 'LNG_COMMON_BUTTON_CHANGE',
        color: 'primary',
        key: 'apply',
        disabled: (_data, handler): boolean => {
          return !handler.form || handler.form.invalid;
        }
      });
    }

    // cancel
    bottomButtons.push({
      type: IV2SideDialogConfigButtonType.CANCEL,
      label: 'LNG_COMMON_BUTTON_CANCEL',
      color: 'text'
    });

    // show dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => modifyQuestion ?
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_BUTTON_MODIFY' :
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_BUTTON_ADD_NEW'
        },
        hideInputFilter: true,
        dontCloseOnBackdrop: true,
        width: '50rem',
        bottomButtons,
        inputs
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // add / update question
        if (add) {
          // create question
          const formData = this.formHelperService.getFields(response.handler.form);
          const question: QuestionModel = new QuestionModel(formData);

          // to value ?
          if (!parent) {
            // must initialize ?
            if (!this.value) {
              this.value = [];
            }

            // add to list
            this.value.push(question);
          } else {
            // must initialize ?
            if (!parent.additionalQuestions) {
              parent.additionalQuestions = [];
            }

            // add to list
            parent.additionalQuestions.push(question);
          }

          // scroll item
          this.scrollToItem(question);
        } else {
          // update question
          const formData = this.formHelperService.getFields(response.handler.form);
          modifyQuestion.text = formData.text;
          modifyQuestion.answerType = formData.answerType;
          modifyQuestion.variable = formData.variable;
          modifyQuestion.category = formData.category;
          modifyQuestion.answersDisplay = formData.answersDisplay;
          modifyQuestion.inactive = formData.inactive;
          modifyQuestion.required = formData.required;
          modifyQuestion.multiAnswer = formData.multiAnswer;
        }

        // close popup
        response.handler.hide();

        // flatten
        this.nonFlatToFlat();

        // trigger on change
        this.onChange(this.value);

        // mark dirty
        this.control?.markAsDirty();

        // update ui
        this.detectChanges();
      });
  }

  /**
   * Add question
   */
  addQuestion(parent: AnswerModel): void {
    this.showAddModifyQuestion(
      true,
      parent,
      undefined
    );
  }

  /**
   * View / Edit question
   */
  viewEditQuestion(
    question: QuestionModel,
    parent: AnswerModel
  ): void {
    this.showAddModifyQuestion(
      false,
      parent,
      question
    );
  }

  /**
   * Show add / modify dialog - answer
   */
  private showAddModifyAnswer(
    add: boolean,
    parent: QuestionModel,
    modifyAnswer: AnswerModel
  ): void {
    // construct array of inputs
    const inputs: V2SideDialogConfigInput[] = [];

    // determine current answer values
    const usedValues: {
      [variable: string]: true
    } = {};
    (parent.answers || []).forEach((item) => {
      // not important ?
      if (item === modifyAnswer) {
        return;
      }

      // remember variable
      usedValues[(item.value || '').toLowerCase()] = true;
    });

    // details ?
    if (add) {
      inputs.push({
        type: V2SideDialogConfigInputType.HTML,
        name: 'details',
        cssClasses: 'gd-form-edit-questionnaire-v2-details',
        placeholder: this.translateService.instant(
          'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_DETAILS', {
            details: parent ?
              parent.text :
              '-'
          }
        )
      });
    }

    // on view only we should display data differently
    if (this.viewOnly) {
      // inputs
      inputs.push(
        // label
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'label',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_LABEL',
          value: modifyAnswer.label
        },

        // answer value
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'value',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_VALUE',
          value: modifyAnswer.value
        },

        // alert
        {
          type: V2SideDialogConfigInputType.KEY_VALUE,
          name: 'alert',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_ALERT',
          value: modifyAnswer.alert ?
            'LNG_COMMON_LABEL_YES' :
            'LNG_COMMON_LABEL_NO'
        }
      );
    } else {
      // inputs
      inputs.push(
        // label
        {
          type: V2SideDialogConfigInputType.TEXTAREA,
          name: 'label',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_LABEL',
          value: modifyAnswer ?
            modifyAnswer.label :
            '',
          validators: {
            required: () => true
          }
        },

        // answer value
        {
          type: V2SideDialogConfigInputType.TEXT,
          name: 'value',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_VALUE',
          value: modifyAnswer ?
            modifyAnswer.value :
            '',
          validators: {
            required: () => true,
            notInObject: () => ({
              values: usedValues,
              err: 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_DUPLICATE_ANSWER_VALUE'
            })
          }
        },

        // alert
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: 'alert',
          placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_ALERT',
          value: modifyAnswer ?
            modifyAnswer.alert :
            false
        }
      );
    }

    // buttons
    const bottomButtons: IV2SideDialogConfigButton[] = [];

    // save
    if (!this.viewOnly) {
      bottomButtons.push({
        type: IV2SideDialogConfigButtonType.OTHER,
        label: 'LNG_COMMON_BUTTON_CHANGE',
        color: 'primary',
        key: 'apply',
        disabled: (_data, handler): boolean => {
          return !handler.form || handler.form.invalid;
        }
      });
    }

    // cancel
    bottomButtons.push({
      type: IV2SideDialogConfigButtonType.CANCEL,
      label: 'LNG_COMMON_BUTTON_CANCEL',
      color: 'text'
    });

    // show dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => modifyAnswer ?
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_BUTTON_MODIFY' :
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_BUTTON_ADD_NEW'
        },
        hideInputFilter: true,
        dontCloseOnBackdrop: true,
        width: '50rem',
        bottomButtons,
        inputs
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // add / update answer
        if (add) {
          // create answer
          const formData = this.formHelperService.getFields(response.handler.form);
          const answer: AnswerModel = new AnswerModel(formData);

          // must initialize ?
          if (!parent.answers) {
            parent.answers = [];
          }

          // add to list
          parent.answers.push(answer);

          // scroll item
          this.scrollToItem(answer);
        } else {
          // update answer
          const formData = this.formHelperService.getFields(response.handler.form);
          modifyAnswer.label = formData.label;
          modifyAnswer.value = formData.value;
          modifyAnswer.alert = formData.alert;
        }

        // close popup
        response.handler.hide();

        // flatten
        this.nonFlatToFlat();

        // trigger on change
        this.onChange(this.value);

        // mark dirty
        this.control?.markAsDirty();

        // update ui
        this.detectChanges();
      });
  }

  /**
   * Add answer
   */
  addAnswer(parent: QuestionModel): void {
    this.showAddModifyAnswer(
      true,
      parent,
      undefined
    );
  }

  /**
   * View / Edit answer
   */
  viewEditAnswer(
    answer: AnswerModel,
    parent: QuestionModel
  ): void {
    this.showAddModifyAnswer(
      false,
      parent,
      answer
    );
  }

  /**
   * Expand collapse
   */
  expandCollapse(item: IFlattenNode): void {
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
    this.nonFlatToFlat();
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
