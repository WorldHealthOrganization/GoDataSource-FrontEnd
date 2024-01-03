import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Host, HostListener, Input, OnDestroy, Optional, SkipSelf, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';
import { Constants } from '../../../../core/models/constants';
import { CdkDrag, CdkDragDrop, CdkDragStart, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
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
import { IV2BottomDialogConfigButtonType } from '../../../components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';

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
  no: string;
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

  // outbreak
  @Input() outbreak: OutbreakModel | OutbreakTemplateModel;

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // flattened questions
  flattenedQuestions: IFlattenNode[];

  // invalid drag zone
  private _isInvalidDragEvent: boolean = true;

  // timers
  private _scrollToItemTimer: number;

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
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service,
    protected activatedRoute: ActivatedRoute,
    protected formHelperService: FormHelperService,
    private referenceDataHelperService: ReferenceDataHelperService
  ) {
    // parent
    super(
      controlContainer,
      i18nService,
      changeDetectorRef
    );

    // update render mode
    this.updateRenderMode();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // stop timers
    this.stopScrollToItemTimer();
  }

  /**
   * Set value
   */
  writeValue(value: QuestionModel[]): void {
    // translate all questions and answers
    const translateQuestions = (questions: QuestionModel[]) => {
      // nothing to do ?
      if (!questions?.length) {
        return;
      }

      // translate questions
      questions.forEach((question) => {
        // translate
        question.text = question.text ?
          this.i18nService.instant(question.text) :
          question.text;

        // translate answers
        (question.answers || []).forEach((answer) => {
          // translate
          answer.label = answer.label ?
            this.i18nService.instant(answer.label) :
            answer.label;

          // translate sub questions
          translateQuestions(answer.additionalQuestions);
        });
      });
    };

    // translate
    translateQuestions(value);

    // start with all questions collapsed
    this.collapseExpandAllQuestions(
      value,
      true
    );

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
   * Collapse / Expand questions and Answers
   */
  collapseExpandAllQuestions(
    items: QuestionModel[] | AnswerModel[],
    collapsed: boolean
  ): void {
    // nothing to collapse ?
    if (!items?.length) {
      return;
    }

    // go through questions / answers and their children and collapse / expand them
    items.forEach((item) => {
      // collapse
      item.collapsed = collapsed;

      // go through children
      if (item instanceof QuestionModel) {
        this.collapseExpandAllQuestions(
          item.answers,
          collapsed
        );
      } else {
        this.collapseExpandAllQuestions(
          item.additionalQuestions,
          collapsed
        );
      }
    });
  }

  /**
   * Convert non flat value to flat value
   */
  nonFlatToFlat(): void {
    // flatten
    this.flattenedQuestions = [];
    this.flatten(
      this.value,
      0,
      null,
      {},
      false,
      ''
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
    oneParentIsInactive: boolean,
    noPrefix: string
  ): void {
    // no questions ?
    if (
      !questions ||
      questions.length < 1
    ) {
      return;
    }

    // go through each question
    let no: number = 1;
    questions.forEach((question, questionIndex) => {
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
        canCollapseOrExpand: question.answers?.length > 0,
        no: question.answerType !== Constants.ANSWER_TYPES.MARKUP.value ?
          `${noPrefix}${noPrefix ? '.' : ''}${no}` :
          undefined
      };

      // add to list
      this.flattenedQuestions.push(flattenedQuestion);

      // count only if not markup
      if (question.answerType !== Constants.ANSWER_TYPES.MARKUP.value) {
        no++;
      }

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
            canCollapseOrExpand: answer.additionalQuestions?.length > 0,
            no: null
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
              flattenedAnswer.oneParentIsInactive,
              flattenedQuestion.no
            );
          }
        });
      }
    });
  }

  /**
   * Stop timer
   */
  private stopScrollToItemTimer(): void {
    if (this._scrollToItemTimer) {
      clearTimeout(this._scrollToItemTimer);
      this._scrollToItemTimer = undefined;
    }
  }

  /**
   * Make sure our item is visible
   */
  private scrollToItem(scrollToItem: QuestionModel | AnswerModel): void {
    // stop previous
    this.stopScrollToItemTimer();

    // not valid ?
    if (!scrollToItem) {
      return;
    }

    // scroll
    this._scrollToItemTimer = setTimeout(() => {
      // reset
      this._scrollToItemTimer = undefined;

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
    const usedQuestionVariables: {
      [variable: string]: true
    } = {};
    const deepAddVariables = (questions: QuestionModel[]) => {
      // nothing to do ?
      if (!questions?.length) {
        return;
      }

      // go through questions
      questions.forEach((question) => {
        // no need to enter variable for markup
        if (
          question.answerType === Constants.ANSWER_TYPES.MARKUP.value ||
          !question.variable
        ) {
          return;
        }

        // add variable
        usedQuestionVariables[question.variable.toLowerCase()] = true;

        // go through answers
        if (question.answers?.length > 0) {
          question.answers.forEach((answer) => {
            deepAddVariables(answer.additionalQuestions);
          });
        }
      });
    };

    // determine current question variables
    deepAddVariables(this.value);

    // details ?
    if (add) {
      inputs.push({
        type: V2SideDialogConfigInputType.HTML,
        name: 'details',
        cssClasses: 'gd-form-edit-questionnaire-v2-details',
        placeholder: this.i18nService.instant(
          'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_DETAILS', {
            details: parent ?
              parent.label :
              '—'
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
            required: () => !modifyQuestion,
            notNumber: () => !modifyQuestion,
            notInObject: () => modifyQuestion ?
              undefined :
              {
                values: usedQuestionVariables,
                err: 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_DUPLICATE_VARIABLE'
              },
            noSpace: () => true
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
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.outbreak,
            (this.activatedRoute.snapshot.data.questionnaireQuestionCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            modifyQuestion?.category
          ),
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
          cssClasses: 'gd-app-side-dialog-v2-content-middle-item-input-row-flex',
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
        label: modifyQuestion ?
          'LNG_COMMON_BUTTON_UPDATE' :
          'LNG_COMMON_BUTTON_ADD',
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
          get: () => this.viewOnly ?
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_BUTTON_VIEW' : (
              modifyQuestion ?
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_BUTTON_MODIFY' :
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_BUTTON_ADD_NEW'
            )
        },
        hideInputFilter: true,
        dontCloseOnBackdrop: true,
        width: '60rem',
        bottomButtons,
        inputs
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // get form data
        const formData = this.formHelperService.getFields(response.handler.form);
        formData.variable = formData.answerType === Constants.ANSWER_TYPES.MARKUP.value ?
          (
            modifyQuestion?.variable ?
              modifyQuestion?.variable :
              uuid()
          ) :
          formData.variable;

        // add / update question
        if (add) {
          // create question
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
   * Delete item
   */
  deleteItem(item: IFlattenNode): void {
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_COMMON_LABEL_DELETE',
            data: () => ({
              name: item.type === FlattenType.QUESTION ?
                (item.data as QuestionModel).text :
                (item.data as AnswerModel).label
            })
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // remove item
        if (item.type === FlattenType.QUESTION) {
          // retrieve array from which we need to remove question
          const parentListOfQuestions: QuestionModel[] = item.parent ?
            (item.parent.data as AnswerModel).additionalQuestions :
            this.value;

          // find our question
          const questionIndex: number = parentListOfQuestions.findIndex((child) => child === item.data);

          // remove
          if (questionIndex > -1) {
            parentListOfQuestions.splice(
              questionIndex,
              1
            );
          }
        } else if (item.type === FlattenType.ANSWER) {
          // retrieve array from which we need to remove answer
          const parentListOfAnswers: AnswerModel[] = (item.parent.data as QuestionModel).answers;

          // find our answer
          const answerIndex: number = parentListOfAnswers.findIndex((child) => child === item.data);

          // remove
          if (answerIndex > -1) {
            parentListOfAnswers.splice(
              answerIndex,
              1
            );
          }
        }

        // re-render
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
        placeholder: this.i18nService.instant(
          'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_DETAILS', {
            details: parent ?
              parent.text :
              '—'
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
        label: modifyAnswer ?
          'LNG_COMMON_BUTTON_UPDATE' :
          'LNG_COMMON_BUTTON_ADD',
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
          get: () => this.viewOnly ?
            'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_BUTTON_VIEW' : (
              modifyAnswer ?
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_BUTTON_MODIFY' :
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_BUTTON_ADD_NEW'
            )
        },
        hideInputFilter: true,
        dontCloseOnBackdrop: true,
        width: '60rem',
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
   * Clone question / answer
   */
  cloneItem(item: IFlattenNode): void {
    // display loading - if we need to create a lot of inputs..it takes a bit of time
    const loading = this.dialogV2Service.showLoadingDialog();

    // display side dialog / clone
    setTimeout(() => {
      // hide loading dialog
      loading.close();

      // info which question is cloned
      const inputs: V2SideDialogConfigInput[] = [];
      inputs.push({
        type: V2SideDialogConfigInputType.HTML,
        name: 'details',
        cssClasses: 'gd-form-edit-questionnaire-v2-details',
        placeholder: this.i18nService.instant(
          'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_CLONING', {
            type: this.i18nService.instant(
              item.data instanceof QuestionModel ?
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TYPE_QUESTION' :
                'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TYPE_ANSWER'
            ),
            item: item.data instanceof QuestionModel ?
              item.data.text :
              item.data.label
          }
        )
      });

      // update used question variables
      let usedQuestionVariables: {
        [variable: string]: true
      } = {};
      const deepAddVariables = (questions: QuestionModel[]) => {
        // nothing to do ?
        if (!questions?.length) {
          return;
        }

        // go through questions
        questions.forEach((question) => {
          // no need to enter variable for markup
          if (
            question.answerType === Constants.ANSWER_TYPES.MARKUP.value ||
            !question.variable
          ) {
            return;
          }

          // add variable
          usedQuestionVariables[question.variable.toLowerCase()] = true;

          // go through answers
          if (question.answers?.length > 0) {
            question.answers.forEach((answer) => {
              deepAddVariables(answer.additionalQuestions);
            });
          }
        });
      };
      const refreshQuestionVariables = () => {
        // reset
        usedQuestionVariables = {};

        // attach existing variables
        deepAddVariables(this.value);

        // attach clone variables
        inputs.forEach((input) => {
          // nothing to do ?
          if (
            !(input.data instanceof QuestionModel) ||
            !(input as IV2SideDialogConfigInputText).value
          ) {
            return;
          }

          // attach variable
          usedQuestionVariables[(input as IV2SideDialogConfigInputText).value.toLowerCase()] = true;
        });
      };

      // construct inputs list
      const createQuestionInputs = (
        questions: QuestionModel[],
        prefix: string,
        isFirst: boolean,
        title: string
      ) => {
        // nothing to do ?
        if (!questions?.length) {
          return;
        }

        // go through questions
        let questionIndex: number = 0;
        questions.forEach((question) => {
          // no need to enter variable for markup
          if (question.answerType === Constants.ANSWER_TYPES.MARKUP.value) {
            return;
          }

          // determine question no
          questionIndex++;
          const questionNo: string = isFirst ?
            prefix :
            `${prefix ? `${prefix}.` : ''}${questionIndex}`;

          // add divider
          inputs.push({
            type: V2SideDialogConfigInputType.DIVIDER
          });

          // add answer title ?
          if (!!title) {
            inputs.push({
              type: V2SideDialogConfigInputType.DIVIDER,
              placeholder: title,
              placeholderMultipleLines: !!title
            });
          }

          // add variable
          inputs.push(
            // question
            {
              type: V2SideDialogConfigInputType.TEXT,
              name: `${question.variable}[text]`,
              placeholder: `${this.i18nService.instant('LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_TEXT')} ${questionNo}`,
              value: question.text,
              validators: {
                required: () => true
              }
            },

            // variable
            {
              type: V2SideDialogConfigInputType.TEXT,
              name: `${question.variable}[variable]`,
              placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_VARIABLE',
              value: undefined,
              data: question,
              change: () => {
                // update unique variables
                refreshQuestionVariables();
              },
              validators: {
                required: () => true,
                notInObject: () => ({
                  values: usedQuestionVariables,
                  err: 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_DUPLICATE_VARIABLE'
                })
              }
            }
          );

          // go through answers
          if (question.answers?.length > 0) {
            question.answers.forEach((answer) => {
              createQuestionInputs(
                answer.additionalQuestions,
                questionNo,
                false,
                answer.label
              );
            });
          }
        });
      };

      // if first is an answer then we need to make sure answer value is unique too
      if (item.data instanceof AnswerModel) {
        // determine current answer values
        const usedAnswerValues: {
          [variable: string]: true
        } = {};
        (item.parent.data as QuestionModel).answers.forEach((answer) => {
          usedAnswerValues[(answer.value || '').toLowerCase()] = true;
        });

        // append answer model
        inputs.push(
          // answer
          {
            type: V2SideDialogConfigInputType.TEXT,
            name: 'answer[label]',
            placeholder: this.i18nService.instant('LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_LABEL'),
            value: item.data.label,
            validators: {
              required: () => true
            }
          },

          // value
          {
            type: V2SideDialogConfigInputType.TEXT,
            name: 'answer[value]',
            placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_VALUE',
            value: undefined,
            validators: {
              required: () => true,
              notInObject: () => ({
                values: usedAnswerValues,
                err: 'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_DUPLICATE_ANSWER_VALUE'
              })
            }
          }
        );
      }

      // variables
      inputs.push({
        type: V2SideDialogConfigInputType.DIVIDER,
        placeholder: 'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_FIELD_LABEL_VARIABLES'
      });

      // retrieve unique variables
      refreshQuestionVariables();

      // start cloning questions
      createQuestionInputs(
        item.data instanceof QuestionModel ?
          [item.data] :
          item.data.additionalQuestions,
        item.data instanceof QuestionModel ?
          item.no :
          '',
        item.data instanceof QuestionModel,
        item.data instanceof QuestionModel ?
          '' :
          item.data.label
      );

      // show dialog
      this.dialogV2Service
        .showSideDialog({
          title: {
            get: () => 'LNG_COMMON_BUTTON_CLONE'
          },
          hideInputFilter: true,
          dontCloseOnBackdrop: true,
          width: '60rem',
          inputs,
          bottomButtons: [
            {
              type: IV2SideDialogConfigButtonType.OTHER,
              label: 'LNG_COMMON_BUTTON_CLONE',
              color: 'primary',
              key: 'apply',
              disabled: (_data, handler): boolean => {
                return !handler.form || handler.form.invalid;
              }
            }, {
              type: IV2SideDialogConfigButtonType.CANCEL,
              label: 'LNG_COMMON_BUTTON_CANCEL',
              color: 'text'
            }
          ]
        })
        .subscribe((response) => {
          // cancelled ?
          if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
            // finished
            return;
          }

          // clone questions
          const cloneQuestions = (
            questionsToClone: QuestionModel[]
          ): QuestionModel[] => {
            // clone
            const accumulator: QuestionModel[] = [];
            questionsToClone.forEach((question) => {
              // markup ?
              if (question.answerType === Constants.ANSWER_TYPES.MARKUP.value) {
                // clone markup question
                const clonedQuestion: QuestionModel = new QuestionModel();
                clonedQuestion.text = question.text;
                clonedQuestion.variable = uuid();
                clonedQuestion.category = question.category;
                clonedQuestion.required = question.required;
                clonedQuestion.inactive = question.inactive;
                clonedQuestion.multiAnswer = question.multiAnswer;
                clonedQuestion.answerType = question.answerType;
                clonedQuestion.answersDisplay = question.answersDisplay;
                clonedQuestion.order = accumulator.length;

                // attach
                accumulator.push(clonedQuestion);

                // finished
                return;
              }

              // clone question
              const clonedQuestion: QuestionModel = new QuestionModel();
              clonedQuestion.text = (response.data.map[`${question.variable}[text]`] as IV2SideDialogConfigInputText).value;
              clonedQuestion.variable = (response.data.map[`${question.variable}[variable]`] as IV2SideDialogConfigInputText).value;
              clonedQuestion.category = question.category;
              clonedQuestion.required = question.required;
              clonedQuestion.inactive = question.inactive;
              clonedQuestion.multiAnswer = question.multiAnswer;
              clonedQuestion.answerType = question.answerType;
              clonedQuestion.answersDisplay = question.answersDisplay;
              clonedQuestion.order = accumulator.length;

              // attach
              accumulator.push(clonedQuestion);

              // has answers ?
              if (question.answers?.length > 0) {
                question.answers.forEach((answer) => {
                  // create answer
                  const clonedAnswer = new AnswerModel();
                  clonedAnswer.label = answer.label;
                  clonedAnswer.value = answer.value;
                  clonedAnswer.alert = answer.alert;
                  clonedAnswer.order = answer.order;

                  // attach
                  clonedQuestion.answers = clonedQuestion.answers || [];
                  clonedQuestion.answers.push(clonedAnswer);

                  // has children questions ?
                  if (answer.additionalQuestions?.length > 0) {
                    clonedAnswer.additionalQuestions = cloneQuestions(answer.additionalQuestions);
                  }
                });
              }
            });

            // finished
            return accumulator;
          };

          // if answer we need to add answer to question
          if (item.data instanceof AnswerModel) {
            // create answer
            const answer = new AnswerModel();
            answer.label = (response.data.map['answer[label]'] as IV2SideDialogConfigInputText).value;
            answer.value = (response.data.map['answer[value]'] as IV2SideDialogConfigInputText).value;
            answer.alert = item.data.alert;
            answer.order = (item.parent.data as QuestionModel).answers.length;

            // add answer
            (item.parent.data as QuestionModel).answers.push(answer);

            // clone questions
            answer.additionalQuestions = item.data.additionalQuestions?.length > 0 ?
              cloneQuestions(item.data.additionalQuestions) :
              null;

            // scroll item
            this.scrollToItem(answer);
          } else {
            // determine accumulator
            const acc: QuestionModel[] = item.parent ?
              (item.parent.data as AnswerModel).additionalQuestions :
              this.value;

            // question
            // clone question
            const clonedQuestion: QuestionModel = new QuestionModel();
            clonedQuestion.text = (response.data.map[`${item.data.variable}[text]`] as IV2SideDialogConfigInputText).value;
            clonedQuestion.variable = (response.data.map[`${item.data.variable}[variable]`] as IV2SideDialogConfigInputText).value;
            clonedQuestion.category = item.data.category;
            clonedQuestion.required = item.data.required;
            clonedQuestion.inactive = item.data.inactive;
            clonedQuestion.multiAnswer = item.data.multiAnswer;
            clonedQuestion.answerType = item.data.answerType;
            clonedQuestion.answersDisplay = item.data.answersDisplay;
            clonedQuestion.order = acc.length;

            // attach
            acc.push(clonedQuestion);

            // clone answers
            if (item.data.answers?.length > 0) {
              item.data.answers.forEach((answer) => {
                // create answer
                const clonedAnswer = new AnswerModel();
                clonedAnswer.label = answer.label;
                clonedAnswer.value = answer.value;
                clonedAnswer.alert = answer.alert;
                clonedAnswer.order = answer.order;

                // attach
                clonedQuestion.answers = clonedQuestion.answers || [];
                clonedQuestion.answers.push(clonedAnswer);

                // has children questions ?
                if (answer.additionalQuestions?.length > 0) {
                  clonedAnswer.additionalQuestions = cloneQuestions(answer.additionalQuestions);
                }
              });
            }

            // scroll item
            this.scrollToItem(clonedQuestion);
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
    }, 200);
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
