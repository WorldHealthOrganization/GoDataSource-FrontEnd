import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import {
  IV2SideDialogConfig,
  IV2SideDialogConfigButton,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputAccordionPanel,
  IV2SideDialogConfigInputFilterList,
  IV2SideDialogConfigInputFilterListFilter, IV2SideDialogConfigInputFilterListSort,
  IV2SideDialogData,
  IV2SideDialogHandler,
  IV2SideDialogResponse,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from './models/side-dialog-config.model';
import { Observable, Subscriber } from 'rxjs';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { SubscriptionLike } from 'rxjs/internal/types';
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterQuestionComparators, V2AdvancedFilterQuestionWhichAnswer, V2AdvancedFilterType } from '../app-list-table-v2/models/advanced-filter.model';
import { Constants } from '../../../core/models/constants';
import { v4 as uuid } from 'uuid';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { RequestFilterOperator, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../app-bottom-dialog-v2/models/bottom-dialog-config.model';

/**
 * Component
 */
@Component({
  selector: 'app-side-dialog-v2',
  templateUrl: './app-side-dialog-v2.component.html',
  styleUrls: ['./app-side-dialog-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppSideDialogV2Component implements OnDestroy {
  // Side Nav
  @ViewChild('sideNav', { static: true }) sideNav: MatSidenav;

  // Form
  private _form: NgForm;
  @ViewChild('form', { static: true }) set form(form: NgForm) {
    // set data
    this._form = form;

    // update handler
    this.dialogHandler.form = this._form;
  }

  // dialog config
  config: IV2SideDialogConfig;
  dialogHandler: IV2SideDialogHandler = {
    // form
    form: null,

    // dialog data
    data: undefined,

    // update
    update: {
      // refresh inputs list
      inputs: (inputs) => {
        // already closed ?
        if (!this.sideNav.opened) {
          return;
        }

        // update inputs
        this.config.inputs = inputs;
        this.updateInputs();

        // update UI
        this.changeDetectorRef.detectChanges();
      },

      // refresh inputs
      refresh: () => {
        // refresh inputs
        this.updateInputs();
      },

      // change title
      changeTitle: (title, data?) => {
        // already closed ?
        if (!this.sideNav.opened) {
          return;
        }

        // update title
        this.config.title = {
          get: () => title,
          data: () => data
        };

        // update UI
        this.changeDetectorRef.detectChanges();
      },

      // used to add filters
      addAdvancedFilter: (input: IV2SideDialogConfigInputFilterList) => {
        return this.addAdvancedFilter(input);
      },
      resetQuestionnaireFilter: (
        filter: IV2SideDialogConfigInputFilterListFilter,
        ...specificProperties: string[]
      ) => {
        this.resetQuestionnaireFilter(
          filter,
          ...specificProperties
        );
      },

      // used to add sorts
      addAdvancedSort:  (input: IV2SideDialogConfigInputFilterList) => {
        return this.addAdvancedSort(input);
      }
    },

    // buttons
    buttons: {
      click: (buttonKey) => {
        // nothing to do ?
        if (!this.config) {
          return;
        }

        // find button
        const button = this.config.bottomButtons.find((item) => item.key === buttonKey);
        if (!button) {
          return;
        }

        // click button
        this.clickedButton(button);
      }
    },

    // hide dialog
    hide: () => {
      // hide without triggering action since it will be triggered bellow with other options
      this.hide();
    },

    // detect changes
    detectChanges: () => {
      // update UI
      this.changeDetectorRef.detectChanges();
    },

    // loading
    loading: {
      // show loading
      show: (
        message?: string,
        messageData?: {
          [key: string]: string
        }
      ) => {
        // already showing ?
        if (this.loading) {
          return;
        }

        // show and update message
        this.loading = {
          message,
          messageData
        };

        // update ui
        this.changeDetectorRef.detectChanges();
      },

      // hide loading
      hide: () => {
        // already not visible ?
        if (!this.loading) {
          return;
        }

        // hide
        this.loading = undefined;

        // update ui
        this.changeDetectorRef.detectChanges();
      },

      // change loading message
      message: (
        message: string,
        messageData?: {
          [key: string]: string
        }
      ) => {
        // not visible, then don't update message
        if (!this.loading) {
          return;
        }

        // update message
        this.loading.message = message;
        this.loading.messageData = messageData;

        // update ui
        this.changeDetectorRef.detectChanges();
      }
    }
  };

  // used to handle responses back to client
  observer$: Subscriber<IV2SideDialogResponse>;

  // filter by value
  filterByValue: string;

  // visible inputs
  filteredInputs: {
    [name: string]: true
  } | false;
  filteredForceParent: {
    [name: string]: true
  } | false;

  // filter suffix buttons
  filterSuffixIconButtons: IAppFormIconButtonV2[] = [
    {
      icon: 'clear',
      clickAction: () => {
        // clear
        this.filterByValue = undefined;

        // filter
        this.filterInputs();
      }
    }
  ];

  // loading setup
  loading: {
    // optional
    message?: string,
    messageData?: {
      [key: string]: string
    }
  } | undefined;

  // sort order options
  sortOrderOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_SIDE_FILTERS_SORT_BY_ASC_PLACEHOLDER',
      value: RequestSortDirection.ASC
    }, {
      label: 'LNG_SIDE_FILTERS_SORT_BY_DESC_PLACEHOLDER',
      value: RequestSortDirection.DESC
    }
  ];

  // operator options
  operatorOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_SIDE_FILTERS_OPERATOR_LABEL_AND',
      value: RequestFilterOperator.AND
    }, {
      label: 'LNG_SIDE_FILTERS_OPERATOR_LABEL_OR',
      value: RequestFilterOperator.OR
    }
  ];

  // questionnaire - which answer
  questionWhichAnswerOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_ANY',
      value: V2AdvancedFilterQuestionWhichAnswer.ANY_ANSWER
    }, {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_LAST',
      value: V2AdvancedFilterQuestionWhichAnswer.LAST_ANSWER
    }
  ];

  // constants
  V2SideDialogConfigInputType = V2SideDialogConfigInputType;
  V2AdvancedFilterType = V2AdvancedFilterType;
  V2AdvancedFilterComparatorType = V2AdvancedFilterComparatorType;
  V2AdvancedFilterQuestionComparators = V2AdvancedFilterQuestionComparators;
  V2AdvancedFilterComparatorOptions = V2AdvancedFilterComparatorOptions;
  Constants = Constants;

  // subscriptions
  locationSubscription: SubscriptionLike;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService,
    protected dialogV2Service: DialogV2Service,
    location: Location
  ) {
    this.locationSubscription = location.subscribe(() => {
      this.hide(true);
    });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release location subscription
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = undefined;
    }
  }

  /**
   * Open sidenav
   */
  show(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    // return response handler
    return new Observable<IV2SideDialogResponse>((observer) => {
      // set listener
      this.observer$ = observer;

      // set data
      this.config = config;

      // update inputs
      this.updateInputs();

      // show all
      this.filterByValue = '';
      this.filterInputs();

      // initialized
      if (config.initialized) {
        config.initialized(this.dialogHandler);
      }

      // show side nav
      this.sideNav.open();

      // make changes
      this.changeDetectorRef.detectChanges();
    });
  }

  /**
   * Hide sidenav
   */
  hide(triggerResponse?: boolean): void {
    // nothing to do ?
    if (!this.sideNav.opened) {
      return;
    }

    // close side nav
    this.sideNav.close();

    // reset data
    this.config = undefined;
    this.filterByValue = undefined;
    this.filteredInputs = undefined;
    this.filteredForceParent = undefined;
    this.dialogHandler.data = undefined;
    this.loading = undefined;

    // trigger response
    if (triggerResponse) {
      this.sendResponse(
        IV2SideDialogConfigButtonType.CANCEL,
        undefined
      );
    }

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Send response to client
   */
  private sendResponse(
    type: IV2SideDialogConfigButtonType,
    key: string,
    data?: IV2SideDialogData
  ): void {
    // nothing to do ?
    if (!this.observer$) {
      return;
    }

    // send response
    const obs = this.observer$;
    obs.next({
      // clicked button
      button: {
        type,
        key
      },

      // handler
      handler: this.dialogHandler,

      // response
      data
    });

    // finished
    obs.complete();

    // reset only if not displaying another dialog
    if (this.observer$ === obs) {
      this.observer$ = undefined;
    }
  }

  /**
   * Clicked button
   */
  clickedButton(button: IV2SideDialogConfigButton): void {
    // cancel ?
    if (button.type === IV2SideDialogConfigButtonType.CANCEL) {
      // hide without triggering action since it will be triggered bellow with other options
      this.hide();

      // cancel
      this.sendResponse(
        button.type,
        button.key
      );

      // finished
      return;
    }

    // other button
    // - include response data too
    this.sendResponse(
      button.type,
      button.key,
      this.dialogHandler.data
    );
  }

  /**
   * Filter inputs
   */
  filterInputs(): void {
    // nothing to filter ?
    if (
      !this.config?.inputs ||
      this.config.inputs.length < 1
    ) {
      // reset
      this.filteredInputs = undefined;
      this.filteredForceParent = undefined;

      // finished
      return;
    }

    // filter - case insensitive
    this.filterByValue = this.filterByValue ?
      this.filterByValue.toLowerCase().trim() :
      this.filterByValue;

    // nothing to filter
    if (!this.filterByValue) {
      // reset
      this.filteredInputs = undefined;
      this.filteredForceParent = undefined;

      // finished
      return;
    }

    // search recursively
    this.filteredInputs = {};
    this.filteredForceParent = {};
    const deepSearch = (inputs: (V2SideDialogConfigInput | IV2SideDialogConfigInputAccordionPanel)[]): boolean => {
      // determine if at least one child is visible
      let childVisible: boolean = false;

      // go through children
      inputs.forEach((input) => {
        // determine if parent should be visible
        if (
          input.name &&
          input.placeholder &&
          this.i18nService.instant(input.placeholder).toLowerCase().indexOf(this.filterByValue) > -1
        ) {
          this.filteredInputs[input.name] = true;
          childVisible = true;
        }

        // if parent should be visible, no need to filter children, show all of them
        if (this.filteredInputs[input.name]) {
          return;
        }

        // filter if input has children ?
        // - type V2SideDialogConfigInputType.GROUP is filtered by parent placeholder, so no need to filter children
        if (input.type === V2SideDialogConfigInputType.ACCORDION) {
          if (deepSearch(input.panels)) {
            // at least one child is visible, so we should make parent visible too
            this.filteredForceParent[input.name] = true;
            childVisible = true;
          }
        } else if (input.type === V2SideDialogConfigInputType.ACCORDION_PANEL) {
          if (deepSearch(input.inputs)) {
            // at least one child is visible, so we should make parent visible too
            this.filteredForceParent[input.name] = true;
            childVisible = true;
          }
        }
      });

      // finished
      return childVisible;
    };

    // nothing found ?
    if (!deepSearch(this.config.inputs)) {
      this.filteredInputs = false;
      this.filteredForceParent = undefined;
    }
  }

  /**
   * Listen for keys
   */
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(keysEvent: KeyboardEvent) {
    // no need to do anything ?
    if (
      this.config?.dontCloseOnBackdrop ||
      this.loading
    ) {
      return;
    }

    // close on escape
    switch (keysEvent.code) {
      case 'Escape':
        this.hide(true);
        break;
    }
  }

  /**
   * Update inputs
   */
  updateInputs(): void {
    // map inputs
    this.dialogHandler.data = {
      inputs: this.config.inputs,
      map: {},
      echo: {}
    };
    this.config.inputs.forEach((input) => {
      // map input
      this.dialogHandler.data.map[input.name] = input;

      // if type list of filters, then further processing is needed
      if (input.type === V2SideDialogConfigInputType.FILTER_LIST) {
        // process options
        input.optionsAsLabelValue = [];
        input.sortableOptionsAsLabelValue = [];
        input.optionsAsLabelValueMap = {};
        input.options.forEach((filterOption) => {
          // option id
          const id: string = `${filterOption.field}${filterOption.label}`;

          // determine label
          const label: string = filterOption.relationshipLabel ?
            `${this.i18nService.instant(filterOption.relationshipLabel)} ${this.i18nService.instant(filterOption.label)}` :
            filterOption.label;

          // create option
          const option: ILabelValuePairModel = {
            label,
            value: id,
            data: filterOption
          };

          // attach option
          input.optionsAsLabelValue.push(option);

          // sortable ?
          if (filterOption.sortable) {
            input.sortableOptionsAsLabelValue.push(option);
          }

          // map option
          input.optionsAsLabelValueMap[id] = option;
        });
      }
    });
  }

  /**
   * Add filter
   */
  addAdvancedFilter(input: IV2SideDialogConfigInputFilterList): IV2SideDialogConfigInputFilterListFilter {
    // create filter
    const advancedFilter: IV2SideDialogConfigInputFilterListFilter = {
      type: V2SideDialogConfigInputType.FILTER_LIST_FILTER,

      // selected value
      value: undefined,
      name: `${input.name}.value[${input.filters.length}]`,

      // filter type
      filterBy: {
        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
        value: undefined,
        name: `${input.name}.filters[${input.filters.length}]`,
        placeholder: 'LNG_LAYOUT_LIST_DEFAULT_FILTER_PLACEHOLDER',
        options: input.optionsAsLabelValue,
        change: (data, _handler, filter) => {
          // get filter
          const filterItem = filter as unknown as IV2SideDialogConfigInputFilterListFilter;
          const filterOption: V2AdvancedFilter = filterItem.filterBy.value ?
            (data.map.filters as IV2SideDialogConfigInputFilterList).optionsAsLabelValueMap[filterItem.filterBy.value].data as V2AdvancedFilter :
            undefined;

          // reset comparator selected value
          filterItem.value = undefined;
          filterItem.comparator.value = undefined;
          if (
            filterOption &&
            filterOption.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS
          ) {
            this.resetQuestionnaireFilter(filterItem);
          } else {
            filterItem.extraValues =  undefined;
          }

          // set comparator options
          if (filterOption.allowedComparators?.length > 0) {
            filterItem.comparator.options = filterOption.allowedComparators;
          } else {
            filterItem.comparator.options = filterOption ?
              V2AdvancedFilterComparatorOptions[filterOption.type] :
              [];
          }
        }
      },

      // filter comparator
      comparator: {
        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
        value: undefined,
        name: `${input.name}.comparator[${input.filters.length}]`,
        placeholder: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL',
        options: [],
        change: (data, _handler, filter) => {
          // reset comparator selected value
          const filterItem = filter as unknown as IV2SideDialogConfigInputFilterListFilter;
          filterItem.value = undefined;

          // reset extra value
          const filterOption: V2AdvancedFilter = filterItem.filterBy.value ?
            (data.map.filters as IV2SideDialogConfigInputFilterList).optionsAsLabelValueMap[filterItem.filterBy.value].data as V2AdvancedFilter :
            undefined;
          if (
            filterOption &&
            filterOption.type === V2AdvancedFilterType.ADDRESS &&
            filterItem.comparator.value === V2AdvancedFilterComparatorType.WITHIN
          ) {
            filterItem.extraValues =  {
              radius: {
                name: uuid(),
                value: undefined
              }
            };
          } else {
            filterItem.extraValues = undefined;
          }
        }
      }
    };

    // add filter
    input.filters.push(advancedFilter);

    // finished
    return advancedFilter;
  }

  /**
   * Reset filters
   */
  resetAdvancedFilter(): void {
    this.clickedButton({
      type: IV2SideDialogConfigButtonType.OTHER,
      key: 'reset',
      label: 'LNG_COMMON_BUTTON_RESET_FILTERS',
      color: 'text'
    });
  }

  /**
   * Remove advanced filter
   */
  removeAdvancedFilter(
    input: IV2SideDialogConfigInputFilterList,
    filter: IV2SideDialogConfigInputFilterListFilter
  ): void {
    // ask for confirmation
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_BUTTON_DELETE_FILTERS'
          },
          message: {
            get: () => 'LNG_COMMON_BUTTON_DELETE_FILTERS_MSG'
          }
        }
      })
      .subscribe((response) => {
        // cancel ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          return;
        }

        // find index
        const filterIndex: number = input.filters.findIndex((item) => item === filter);
        if (filterIndex < 0) {
          return;
        }

        // remove
        input.filters.splice(filterIndex, 1);

        // update side dialog
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Reset extra values for questionnaire
   */
  resetQuestionnaireFilter(
    filter: IV2SideDialogConfigInputFilterListFilter,
    ...specificProperties: string[]
  ): void {
    // reset everything ?
    if (
      !specificProperties ||
      specificProperties.length < 1
    ) {
      filter.extraValues = {
        whichAnswer: {
          name: uuid(),
          value: undefined
        },
        whichAnswerDate: {
          name: uuid(),
          value: undefined
        },
        comparator: {
          name: uuid(),
          value: undefined
        },
        filterValue: {
          name: uuid(),
          value: undefined
        }
      };
    } else {
      specificProperties.forEach((property) => {
        filter.extraValues[property] = {
          name: uuid(),
          value: undefined
        };
      });
    }
  }

  /**
   * Add sort
   */
  addAdvancedSort(input: IV2SideDialogConfigInputFilterList): IV2SideDialogConfigInputFilterListSort {
    // create sort
    const advancedSort: IV2SideDialogConfigInputFilterListSort = {
      type: V2SideDialogConfigInputType.FILTER_LIST_SORT,

      // sort by
      sortBy: {
        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
        value: undefined,
        name: `${input.name}.sorts[${input.sorts.length}]`,
        placeholder: 'LNG_SIDE_FILTERS_SORT_BY_PLACEHOLDER',
        options: input.sortableOptionsAsLabelValue
      },

      // order - asc / desc
      order: {
        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
        value: undefined,
        name: `${input.name}.order[${input.sorts.length}]`,
        placeholder: 'LNG_SIDE_FILTERS_SORT_DIRECTION_LABEL',
        options: this.sortOrderOptions
      }
    };

    // add sort
    input.sorts.push(advancedSort);

    // finished
    return advancedSort;
  }

  /**
   * Remove advanced sort
   */
  removeAdvancedSort(
    input: IV2SideDialogConfigInputFilterList,
    sort: IV2SideDialogConfigInputFilterListSort
  ): void {
    // ask for confirmation
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_BUTTON_DELETE_SORTS'
          },
          message: {
            get: () => 'LNG_COMMON_BUTTON_DELETE_SORTS_MSG'
          }
        }
      })
      .subscribe((response) => {
        // cancel ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          return;
        }

        // find index
        const sortIndex: number = input.sorts.findIndex((item) => item === sort);
        if (sortIndex < 0) {
          return;
        }

        // remove
        input.sorts.splice(sortIndex, 1);

        // update side dialog
        this.changeDetectorRef.detectChanges();
      });
  }

}
