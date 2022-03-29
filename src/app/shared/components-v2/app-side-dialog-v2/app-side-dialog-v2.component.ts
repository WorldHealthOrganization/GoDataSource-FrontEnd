import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import {
  IV2SideDialogConfig,
  IV2SideDialogConfigButton,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputAccordionPanel,
  IV2SideDialogConfigInputFilterList, IV2SideDialogConfigInputFilterListItem,
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
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../app-list-table-v2/models/advanced-filter.model';
import { Constants } from '../../../core/models/constants';
import { v4 as uuid } from 'uuid';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';

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

  // constants
  V2SideDialogConfigInputType = V2SideDialogConfigInputType;
  V2AdvancedFilterType = V2AdvancedFilterType;
  V2AdvancedFilterComparatorType = V2AdvancedFilterComparatorType;
  Constants = Constants;

  // subscriptions
  locationSubscription: SubscriptionLike;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService,
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
    this.observer$.next({
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
    this.observer$.complete();
    this.observer$ = undefined;
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
      map: {}
    };
    this.config.inputs.forEach((input) => {
      // map input
      this.dialogHandler.data.map[input.name] = input;

      // if type list of filters, then further processing is needed
      if (input.type === V2SideDialogConfigInputType.FILTER_LIST) {
        // process options
        input.optionsAsLabelValue = [];
        input.optionsAsLabelValueMap = {};
        input.options.forEach((filterOption) => {
          // option id
          const id: string = filterOption.id || uuid();

          // create option
          const option: ILabelValuePairModel = {
            label: filterOption.label,
            value: id,
            data: filterOption
          };

          // attach option
          input.optionsAsLabelValue.push(option);

          // map option
          input.optionsAsLabelValueMap[id] = option;
        });
      }
    });
  }

  /**
   * Add filter
   */
  addAdvancedFilter(input: IV2SideDialogConfigInputFilterList): void {
    // add filter
    input.filters.push({
      type: V2SideDialogConfigInputType.FILTER_LIST_ITEM,

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
          // reset comparator selected value
          const filterItem = filter as unknown as IV2SideDialogConfigInputFilterListItem;
          filterItem.value = undefined;
          filterItem.comparator.value = undefined;

          // set comparator options
          const filterOption: V2AdvancedFilter = filterItem.filterBy.value ?
            (data.map.filters as IV2SideDialogConfigInputFilterList).optionsAsLabelValueMap[filterItem.filterBy.value].data as V2AdvancedFilter :
            undefined;
          filterItem.comparator.options = filterOption ?
            V2AdvancedFilterComparatorOptions[filterOption.type] :
            [];
        }
      },

      // filter comparator
      comparator: {
        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
        value: undefined,
        name: `${input.name}.comparator[${input.filters.length}]`,
        placeholder: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL',
        options: [],
        change: (_data, _handler, filter) => {
          // reset comparator selected value
          const filterItem = filter as unknown as IV2SideDialogConfigInputFilterListItem;
          filterItem.value = undefined;
        }
      }
    });
  }
}
