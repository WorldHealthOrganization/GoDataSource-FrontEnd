import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Host, HostListener, Input, OnDestroy, Optional, Output, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AnswerModel, IAnswerData, QuestionModel } from '../../../../core/models/question.model';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
import { Constants } from '../../../../core/models/constants';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';
import * as moment from 'moment';
import { IV2BottomDialogConfigButtonType } from '../../../components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';

/**
 * Flatten type
 */
enum FlattenType {
  QUESTION,
  ANSWER,
  ANSWER_MULTI_DATE
}

/**
 * Answer draw type
 */
enum FlattenAnswerDrawType {
  SINGLE_SELECT,
  MULTIPLE_SELECT,
  TEXT,
  NUMBER,
  DATE,
  FILE
}

/**
 * Flatten node answer draw - single select
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
 * Flatten node answer draw - text
 */
interface IFlattenNodeAnswerDrawText {
  type: FlattenAnswerDrawType.TEXT;
}

/**
 * Flatten node answer draw - number
 */
interface IFlattenNodeAnswerDrawNumber {
  type: FlattenAnswerDrawType.NUMBER;
}

/**
 * Flatten node answer draw - date
 */
interface IFlattenNodeAnswerDrawDate {
  type: FlattenAnswerDrawType.DATE;
}

/**
 * Allowed types
 */
type FlattenNodeAnswerDraw = IFlattenNodeAnswerDrawSingleSelect | IFlattenNodeAnswerDrawMultipleSelect | IFlattenNodeAnswerDrawText
| IFlattenNodeAnswerDrawNumber | IFlattenNodeAnswerDrawDate;

/**
 * Flatten node answer
 */
interface IFlattenNodeAnswer {
  // required
  type: FlattenType.ANSWER;
  level: number;
  parent: IFlattenNodeQuestion;
  oneParentIsInactive: boolean;
  name: string;
  index: number;
  definition: FlattenNodeAnswerDraw;
  collapsed: boolean;
}

/**
 * Flatten node answer multi date
 */
interface IFlattenNodeAnswerMultiDate {
  // required
  type: FlattenType.ANSWER_MULTI_DATE;
  level: number;
  parent: IFlattenNodeQuestion;
  oneParentIsInactive: boolean;
  name: string;
  index: number;
  no: string;
  collapsed: boolean;
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
  questionRow: number;
  no: string;
  collapsed: boolean;
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
    this.nonFlatToFlat(
      false,
      true
    );
  }

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // handlers
  private _nonFlatToFlatWait: any;

  // handle errors
  private _errorsCount: number;
  private _errors: {
    [row: number]: IFlattenNodeQuestion
  };
  get hasErrors(): boolean {
    return this._errorsCount > 0;
  }

  // errors changed
  @Output() errorsChanged = new EventEmitter<string>();

  // flattened questions
  private _allFlattenedQuestions: (IFlattenNodeQuestion | IFlattenNodeAnswerMultiDate | IFlattenNodeAnswer)[] = [];
  flattenedQuestions: (IFlattenNodeQuestion | IFlattenNodeAnswerMultiDate | IFlattenNodeAnswer)[] = [];

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
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service
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
    this.nonFlatToFlat(
      false,
      true
    );
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
  private nonFlatToFlat(
    waited: boolean,
    checkForMultiAnswerMissingValues: boolean
  ): void {
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
        this.nonFlatToFlat(
          true,
          checkForMultiAnswerMissingValues
        );
      });

      // finished
      return;
    }

    // make sure all multi answer questions have the proper responses
    if (checkForMultiAnswerMissingValues) {
      this._questionnaire.forEach((question) => {
        this.fillOutValuesForMultiAnswerQuestion(question);
      });
    }

    // flatten
    this._errors = {};
    this._errorsCount = 0;
    this._allFlattenedQuestions = [];
    this.flatten(
      this._allFlattenedQuestions,
      this._questionnaire,
      0,
      null,
      false,
      0,
      '',
      false
    );

    // update visible
    this.flattenedQuestions = this._allFlattenedQuestions.filter((item) => !item.collapsed);

    // update errors data
    this.updateErrorsData();
  }

  /**
   * Flatten
   */
  private flatten(
    accumulator: (IFlattenNodeQuestion | IFlattenNodeAnswerMultiDate | IFlattenNodeAnswer)[],
    questions: QuestionModel[],
    level: number,
    parent: IFlattenNodeAnswer,
    oneParentIsInactive: boolean,
    answerParentIndex: number,
    noPrefix: string,
    collapsed: boolean
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
    questions.forEach((question) => {
      // should we show inactive question ?
      if (
        question.inactive && (
          !this.value[question.variable] ||
          this.value[question.variable].length < 1 ||
          !this.value[question.variable][0].value
        )
      ) {
        // don't render it
        return;
      }

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
        canCollapseOrExpand: question.answers?.length > 0,
        questionRow: accumulator.length,
        no: `${noPrefix}${noPrefix ? '.' : ''}${no}`,
        collapsed
      };

      // add to list
      accumulator.push(flattenedQuestion);
      no++;

      // process question type
      switch (question.answerType) {
        case Constants.ANSWER_TYPES.SINGLE_SELECTION.value:
        case Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value:
          // attach answers if we have any
          if (question.answers?.length > 0) {
            // go through answers and map those with child questions
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
                // map for easy access later
                answersWithQuestionsMap[answer.value] = answer;
              }
            });

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

            // map options
            const options: ILabelValuePairModel[] = question.answers.map((answer) => ({
              label: answer.label,
              value: answer.value
            }));

            // render
            const render = (answerIndex: number) => {
              // attach date if we are on root response - question
              if (
                flattenedQuestion.data.multiAnswer &&
                level === 0
              ) {
                // flatten
                accumulator.push({
                  type: FlattenType.ANSWER_MULTI_DATE,
                  level: flattenedQuestion.level + 1,
                  parent: flattenedQuestion,
                  oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
                  name: `${this.name}[${question.variable}][${answerIndex}].date`,
                  index: answerIndex,
                  collapsed: collapsed || flattenedQuestion.data.collapsed,
                  no: `${flattenedQuestion.no}.${answerIndex + 1}`
                });
              }

              // get item
              const item: IAnswerData = this.value[flattenedQuestion.data.variable][answerIndex];

              // flatten
              const flattenedAnswer: IFlattenNodeAnswer = {
                type: FlattenType.ANSWER,
                level: flattenedQuestion.level + 1,
                parent: flattenedQuestion,
                oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
                name: `${this.name}[${question.variable}][${answerIndex}].value`,
                index: answerIndex,
                collapsed: collapsed || flattenedQuestion.data.collapsed,
                definition: question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value ?
                  {
                    type: FlattenAnswerDrawType.MULTIPLE_SELECT,
                    options
                  } : {
                    type: FlattenAnswerDrawType.SINGLE_SELECT,
                    options
                  }
              };

              // add to list
              accumulator.push(flattenedAnswer);

              // determine if we need to show other things depending on what was selected
              // multiple answer question ?
              if (question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) {
                // go through each multiple response
                if (item.value?.length > 0) {
                  item.value.forEach((answerValue: string) => {
                    if (answersWithQuestionsMap[answerValue]) {
                      // flatten children questions
                      this.flatten(
                        accumulator,
                        answersWithQuestionsMap[answerValue].additionalQuestions,
                        flattenedAnswer.level + 1,
                        flattenedAnswer,
                        flattenedAnswer.oneParentIsInactive,
                        answerIndex,
                        `${flattenedQuestion.no}.${answerIndex + 1}`,
                        collapsed || flattenedQuestion.data.collapsed
                      );
                    }
                  });
                }
              } else {
                if (answersWithQuestionsMap[item.value]) {
                  // flatten children questions
                  this.flatten(
                    accumulator,
                    answersWithQuestionsMap[item.value].additionalQuestions,
                    flattenedAnswer.level + 1,
                    flattenedAnswer,
                    flattenedAnswer.oneParentIsInactive,
                    answerIndex,
                    `${flattenedQuestion.no}.${answerIndex + 1}`,
                    collapsed || flattenedQuestion.data.collapsed
                  );
                }
              }
            };

            // determine how many answers we should generate
            if (level === 0) {
              this.value[flattenedQuestion.data.variable].forEach((_item, answerIndex) => {
                render(answerIndex);
              });
            } else {
              render(answerParentIndex);
            }
          }

          // finished
          break;

        case Constants.ANSWER_TYPES.FREE_TEXT.value:
        case Constants.ANSWER_TYPES.NUMERIC.value:
        case Constants.ANSWER_TYPES.DATE_TIME.value:
          // create definition
          let definition: FlattenNodeAnswerDraw;
          if (question.answerType === Constants.ANSWER_TYPES.FREE_TEXT.value) {
            definition = {
              type: FlattenAnswerDrawType.TEXT
            };
          } else if (question.answerType === Constants.ANSWER_TYPES.NUMERIC.value) {
            definition = {
              type: FlattenAnswerDrawType.NUMBER
            };
          } else if (question.answerType === Constants.ANSWER_TYPES.DATE_TIME.value) {
            definition = {
              type: FlattenAnswerDrawType.DATE
            };
          }

          // initialize value if necessary too
          if (
            !this.value[flattenedQuestion.data.variable] ||
            this.value[flattenedQuestion.data.variable].length < 1
          ) {
            this.value[flattenedQuestion.data.variable] = [{
              value: undefined
            }];
          }

          // render
          const render = (answerIndex: number) => {
            // attach date if we are on root response - question
            if (
              flattenedQuestion.data.multiAnswer &&
              level === 0
            ) {
              // flatten
              accumulator.push({
                type: FlattenType.ANSWER_MULTI_DATE,
                level: flattenedQuestion.level + 1,
                parent: flattenedQuestion,
                oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
                name: `${this.name}[${question.variable}][${answerIndex}].date`,
                index: answerIndex,
                collapsed: collapsed || flattenedQuestion.data.collapsed,
                no: `${flattenedQuestion.no}.${answerIndex + 1}`
              });
            }

            // flatten
            const flattenedAnswer: IFlattenNodeAnswer = {
              type: FlattenType.ANSWER,
              level: flattenedQuestion.level + 1,
              parent: flattenedQuestion,
              oneParentIsInactive: (flattenedQuestion.data as QuestionModel).inactive || flattenedQuestion.oneParentIsInactive,
              name: `${this.name}[${question.variable}][${answerIndex}].value`,
              index: answerIndex,
              definition,
              collapsed: collapsed || flattenedQuestion.data.collapsed
            };

            // add to list
            accumulator.push(flattenedAnswer);
          };

          // determine how many answers we should generate
          if (level === 0) {
            this.value[flattenedQuestion.data.variable].forEach((_item, answerIndex) => {
              render(answerIndex);
            });
          } else {
            render(answerParentIndex);
          }

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

      // validate question, answer
      this.validateQuestionAnswer(
        flattenedQuestion,
        false
      );
    });
  }

  /**
   * Update questionnaire
   */
  answersWithChildrenQuestionsChanged(): void {
    // update questionnaire
    this.nonFlatToFlat(
      true,
      false
    );

    // make dirty
    this.onChange(this.value);
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
    this.nonFlatToFlat(
      true,
      false
    );
  }

  /**
   * Fill out missing values
   */
  private fillOutValuesForMultiAnswerQuestion(question: QuestionModel): void {
    // multi answer ?
    if (!question.multiAnswer) {
      return;
    }

    // add missing values
    // - try to map by date if answers already exist, maybe answer on index 2 should actually be answer 3 while on 2 we should put empty because a parent intermediary response was changed at a specific time
    const addMissingValues = (childQuestion: QuestionModel) => {
      // must initialize ?
      if (!this.value[childQuestion.variable]) {
        this.value[childQuestion.variable] = [];
      }

      // if original variable we just need to fill out
      if (childQuestion.variable === question.variable) {
        // nothing to do since the number of items is the question ...answers length
        // jump to children
      } else {
        // fill out with dates or empty
        const oldValues = this.value[childQuestion.variable];
        const numberOfValues: number = this.value[question.variable].length;
        this.value[childQuestion.variable] = [];
        for (let childIndex = 0; childIndex < numberOfValues; childIndex++) {
          // get parent date
          let dateFormatted = this.value[question.variable][childIndex].date;
          const dateISO = dateFormatted ?
            moment(dateFormatted).toISOString() :
            undefined;
          dateFormatted = dateFormatted ?
            moment(dateFormatted).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            dateFormatted;

          // if date provided, then search for child with same date
          let answerIndexDeterminedByDate: number = oldValues
            .findIndex((answer) => {
              return (
                !dateFormatted &&
                !answer.date
              ) || (
                dateFormatted &&
                answer.date &&
                moment(answer.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) === dateFormatted
              );
            });

          // found our item ?
          if (answerIndexDeterminedByDate > -1) {
            this.value[childQuestion.variable].push(oldValues.splice(answerIndexDeterminedByDate, 1)[0]);
          } else {
            // fill with next empty...
            answerIndexDeterminedByDate = oldValues.findIndex((item) => !item.date);
            if (answerIndexDeterminedByDate > -1) {
              this.value[childQuestion.variable].push({
                date: dateISO,
                value: oldValues.splice(answerIndexDeterminedByDate, 1)[0].value
              });
            } else {
              // fill with empty
              this.value[childQuestion.variable].push({
                date: dateISO,
                value: undefined
              });
            }
          }
        }
      }

      // check children
      (childQuestion.answers || []).forEach((childAnswer) => {
        if (childAnswer.additionalQuestions?.length > 0) {
          childAnswer.additionalQuestions.forEach((cQuestion) => {
            addMissingValues(cQuestion);
          });
        }
      });
    };

    // must initialize ?
    if (!this.value[question.variable]) {
      this.value[question.variable] = [];
    }

    // add missing indexes - used by multi-answer so responses from other questions match as index, otherwise they won't be matched properly after selection
    // - if one child question appears when an answer is selected, if on one date we select it while on other we don't...the index won't match anymore
    addMissingValues(question);
  }

  /**
   * Determine variables under a multi question
   */
  private determineMultiQuestionVariables(rootQuestion: QuestionModel): string[] {
    // - remove answer from multi answer question... should remove child array items too
    // opposite of fillOutValuesForMultiAnswerQuestion
    // determine all variables for which we need to remove answers
    const variables: string[] = [];
    const determineVariables = (question: QuestionModel) => {
      // add to list
      variables.push(question.variable);

      // check children
      (question.answers || []).forEach((answer) => {
        (answer.additionalQuestions || []).forEach((cQuestion) => {
          determineVariables(cQuestion);
        });
      });
    };

    // start from root
    determineVariables(rootQuestion);

    // finished
    return variables;
  }

  /**
   * On change multi date
   */
  onChangeMultiDate(item: IFlattenNodeAnswerMultiDate): void {
    // add to list of items to update
    const variables: string[] = this.determineMultiQuestionVariables(item.parent.data);

    // update children dates too...
    // those on the same indexes
    variables.forEach((variable) => {
      if (this.value[variable].length > item.index) {
        this.value[variable][item.index].date = this.value[item.parent.data.variable][item.index].date ?
          moment(this.value[item.parent.data.variable][item.index].date) :
          this.value[item.parent.data.variable][item.index].date;
      }
    });

    // validate
    this.validateQuestionAnswer(
      item.parent,
      true
    );

    // change
    this.onChange(this.value);
  }

  /**
   * Add multi answer
   */
  addMultiAnswer(item: IFlattenNodeQuestion): void {
    // add to list of items to add data
    const variables: string[] = this.determineMultiQuestionVariables(item.data);
    variables.forEach((variable) => {
      this.value[variable].splice(0, 0, {
        date: undefined,
        value: undefined
      });
    });

    // re-render
    this.nonFlatToFlat(
      true,
      false
    );

    // trigger on change
    this.onChange(this.value);

    // update ui
    this.detectChanges();
  }

  /**
   * Remove item
   */
  removeMultiAnswer(item: IFlattenNodeAnswerMultiDate): void {
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_REMOVE_MULTI_ANSWER'
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // add to list of items to clear up
        const variables: string[] = this.determineMultiQuestionVariables(item.parent.data);

        // clean up
        variables.forEach((variable) => {
          if (this.value[variable].length > item.index) {
            this.value[variable].splice(item.index, 1);
          }
        });

        // re-render
        this.nonFlatToFlat(
          true,
          false
        );

        // trigger on change
        this.onChange(this.value);

        // update ui
        this.detectChanges();
      });
  }

  /**
   * Validate question
   */
  private validateQuestionAnswer(
    flatQuestion: IFlattenNodeQuestion,
    updateErrorsData: boolean
  ): void {
    // check all answers
    let isValid: boolean = true;
    const answers: IAnswerData[] = (this.value[flatQuestion.data.variable] || []);
    for (let answerIndex = 0; answerIndex < answers.length; answerIndex++) {
      // retrieve answer
      const answer: IAnswerData = answers[answerIndex];

      // validate
      if (
        (
          flatQuestion.data.multiAnswer && (
            answer.value ||
            answer.value === 0
          ) && (
            flatQuestion.data.answerType !== Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value ||
            answer.value.length > 0
          ) &&
          !answer.date
        ) || (
          flatQuestion.data.required && (
            (
              !answer.value &&
              answer.value !== 0
            ) || (
              flatQuestion.data.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value &&
              answer.value.length < 1
            )
          )
        )
      ) {
        // not valid
        isValid = false;

        // stop
        break;
      }
    }

    // valid ?
    let somethingChanged: boolean = false;
    if (isValid) {
      if (this._errors[flatQuestion.questionRow]) {
        // cleanup
        delete this._errors[flatQuestion.questionRow];

        // something changed
        somethingChanged = true;
      }
    } else {
      if (!this._errors[flatQuestion.questionRow]) {
        // put error
        this._errors[flatQuestion.questionRow] = flatQuestion;

        // something changed
        somethingChanged = true;
      }
    }

    // reconstruct errors html
    // - count errors
    if (
      updateErrorsData &&
      somethingChanged
    ) {
      this.updateErrorsData();
    }
  }

  /**
   * Update errors data
   */
  private updateErrorsData(): void {
    // determine and count errors
    const errors: IFlattenNodeQuestion[] = Object.values(this._errors);
    this._errorsCount = errors.length;

    // construct errors html
    let errorsString: string = '';
    errors.forEach((error) => {
      errorsString += `<br/>- ${error.no}`;
    });

    // emit errors updated
    this.errorsChanged.emit(errorsString);
  }

  /**
   * On change
   */
  onChangeValue(item: IFlattenNodeAnswer): void {
    // validate
    this.validateQuestionAnswer(
      item.parent,
      true
    );

    // make dirty
    this.onChange(this.value);
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
