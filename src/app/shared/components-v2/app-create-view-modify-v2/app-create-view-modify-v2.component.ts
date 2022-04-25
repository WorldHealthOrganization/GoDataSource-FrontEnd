import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CreateViewModifyV2Action } from './models/action.model';
import { CreateViewModifyV2ActionType, CreateViewModifyV2MenuType, CreateViewModifyV2TabInputType, ICreateViewModifyV2, ICreateViewModifyV2Tab, ICreateViewModifyV2TabInputList } from './models/tab.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { NgForm } from '@angular/forms';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { Constants } from '../../../core/models/constants';
import { AddressModel } from '../../../core/models/address.model';
import { ILocation } from '../../forms-v2/core/app-form-location-base-v2';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { Subscription } from 'rxjs/internal/Subscription';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { V2AdvancedFilter } from '../app-list-table-v2/models/advanced-filter.model';
import { SavedFilterData } from '../../../core/models/saved-filters.model';

/**
 * Component
 */
@Component({
  selector: 'app-create-view-modify-v2',
  templateUrl: './app-create-view-modify-v2.component.html',
  styleUrls: ['./app-create-view-modify-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCreateViewModifyV2Component implements OnInit, OnDestroy {
  // page type
  // - determined from route data
  @Input() action: CreateViewModifyV2Action;
  get isCreate(): boolean {
    return this.action === CreateViewModifyV2Action.CREATE;
  }
  get isView(): boolean {
    return this.action === CreateViewModifyV2Action.VIEW;
  }
  get isModify(): boolean {
    return this.action === CreateViewModifyV2Action.MODIFY;
  }

  // loading item data ?
  @Input() loadingItemData: boolean;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;
  @Input() pageTitleData: {
    [key: string]: string
  };

  // tabs to render
  @Input() tabData: ICreateViewModifyV2;

  // age - dob options
  ageDOBOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_ENTITY_FIELD_LABEL_AGE',
      value: true
    }, {
      label: 'LNG_ENTITY_FIELD_LABEL_DOB',
      value: false
    }
  ];
  ageTypeOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_AGE_FIELD_LABEL_YEARS',
      value: true
    }, {
      label: 'LNG_AGE_FIELD_LABEL_MONTHS',
      value: false
    }
  ];

  // Go through forms and determine if one is pending
  get hasPendingForm(): boolean {
    // nothing to check ?
    if (
      !this.tabData ||
      !this.tabData.tabs ||
      this.tabData.tabs.length < 1
    ) {
      return false;
    }

    // check forms
    for (let index: number = 0; index < this.tabData.tabs.length; index++) {
      if (this.tabData.tabs[index].form?.pending) {
        return true;
      }
    }

    // all forms are okay
    return false;
  }

  // list of records
  expandList: boolean = false;

  // search
  expandListSearchValue: string;
  expandListSearchSuffixButtons: IAppFormIconButtonV2[] = [
    {
      icon: 'search',
      clickAction: () => {
        this.expandListSearch();
      }
    }
  ];

  // load data ?
  expandListInitialized: boolean = false;
  expandListLoadingData: boolean = false;

  // list title
  @Input() listTitle: string;

  // records
  expandListRecordsSubscription: Subscription;
  private _expandListRecords$: Observable<any[]>;
  @Input() set expandListRecords$(expandListRecords$: Observable<any[]>) {
    // set data
    this._expandListRecords$ = expandListRecords$;

    // must reload data
    this.expandListInitialized = false;

    // nothing to do ?
    if (!this.expandList) {
      return;
    }

    // retrieve data
    this.expandListRetrieveData();
  }
  get expandListRecords$(): Observable<any[]> {
    return this._expandListRecords$;
  }

  // query builder
  private _expandListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

  // advanced filters
  @Input() expandListAdvancedFilterType: string;
  @Input() expandListAdvancedFilters: V2AdvancedFilter[];
  @Input() expandListAdvancedFiltersApplied: SavedFilterData;

  // refresh data
  @Output() expandListRefreshData = new EventEmitter<RequestQueryBuilder>();

  // constants
  CreateViewModifyV2TabInputType = CreateViewModifyV2TabInputType;
  Constants = Constants;
  CreateViewModifyV2MenuType = CreateViewModifyV2MenuType;
  FormHelperService = FormHelperService;

  /**
   * Constructor
   */
  constructor(
    protected elementRef: ElementRef,
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service,
    protected formHelper: FormHelperService,
    protected toastV2Service: ToastV2Service
  ) {}

  /**
   * Initialize resources
   */
  ngOnInit(): void {
    // update table size
    this.resizeTable();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // stop retrieving data
    this.expandListStopGetRecords();
  }

  /**
   * Stop retrieving data
   */
  private expandListStopGetRecords(): void {
    // stop retrieving data
    if (this.expandListRecordsSubscription) {
      this.expandListRecordsSubscription.unsubscribe();
      this.expandListRecordsSubscription = undefined;
    }
  }

  /**
   * Should update height of table
   */
  resizeTable(): void {
    // local variables
    let margins;

    // determine top part used space
    let topHeight: number = 0;
    const top = this.elementRef.nativeElement.querySelector('.gd-create-view-modify-top');
    if (top) {
      // add height
      topHeight += top.offsetHeight;

      // get top margins
      margins = getComputedStyle(top);
      if (margins) {
        // top margin
        if (margins.marginTop) {
          topHeight += parseInt(margins.marginTop, 10);
        }

        // bottom margin
        if (margins.marginBottom) {
          topHeight += parseInt(margins.marginBottom, 10);
        }
      }
    }

    // set table height
    const table = this.elementRef.nativeElement.querySelector('.gd-create-view-modify-bottom');
    if (table) {
      // set main table height - mat card
      table.style.height = `calc(100% - ${topHeight}px)`;
    }
  }

  /**
   * Add new item to list
   */
  addListItem(
    input: ICreateViewModifyV2TabInputList,
    form: NgForm
  ): void {
    // add new item to list
    input.items.push(input.definition.add.newItem());

    // trigger items changed
    if (input.itemsChanged) {
      input.itemsChanged(input);
    }

    // mark list as dirty
    this.markArrayItemsAsDirty(
      form,
      input.name
    );
  }

  /**
   * Remove item from list
   */
  removeListItem(
    input: ICreateViewModifyV2TabInputList,
    itemIndex: number,
    form: NgForm
  ): void {
    // delete method
    const deleteItem = () => {
      // remove item
      input.items.splice(itemIndex, 1);

      // trigger items changed
      if (input.itemsChanged) {
        input.itemsChanged(input);
      }

      // mark list as dirty
      this.markArrayItemsAsDirty(
        form,
        input.name
      );

      // re-render ui
      this.changeDetectorRef.detectChanges();

      // needed to update mat tab label warnings
      if (this.isModify) {
        this.changeDetectorRef.markForCheck();
      }
    };

    // ask for confirmation
    this.dialogV2Service.showConfirmDialog({
      config: {
        title: {
          get: () => 'LNG_PAGE_ACTION_DELETE'
        },
        message: {
          get: () => input.definition.remove.confirmLabel
        }
      }
    }).subscribe((response) => {
      // canceled ?
      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
        // finished
        return;
      }

      // remove item
      deleteItem();
    });
  }

  /**
   * Update form
   */
  updateForm(
    tab: ICreateViewModifyV2Tab,
    form: NgForm
  ): void {
    tab.form = form;
  }

  /**
   * Address location changed
   */
  addressLocationChanged(
    address: AddressModel,
    locationInfo: ILocation
  ): void {
    // should we copy location lat & lng ?
    if (
      locationInfo &&
      locationInfo.geoLocation &&
      locationInfo.geoLocation.lat &&
      locationInfo.geoLocation.lng
    ) {
      this.dialogV2Service
        .showConfirmDialog({
          config: {
            title: {
              get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
            },
            message: {
              get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
            }
          }
        })
        .subscribe((response) => {
          // canceled ?
          if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
            // finished
            return;
          }

          // change location lat & lng
          address.geoLocation.lat = locationInfo.geoLocation.lat;
          address.geoLocation.lng = locationInfo.geoLocation.lng;

          // update ui
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  /**
   * Mark forms as pristine
   */
  markFormsAsPristine(): void {
    // mark all forms as pristine
    (this.tabData?.tabs || []).forEach((tab) => {
      // nothing to do ?
      if (!tab.form) {
        return;
      }

      // mark as pristine
      tab.form.control.markAsPristine();
    });
  }

  /**
   * Create item
   */
  create(): void {
    // determine forms
    const forms: NgForm[] = this.tabData.tabs.map((tab) => tab.form).filter((item) => !!item);

    // validate
    if (!this.formHelper.isFormsSetValid(forms)) {
      return;
    }

    // determine form data
    const fieldData = this.formHelper.mergeFields(forms);
    if (_.isEmpty(fieldData)) {
      return;
    }

    // show loading
    const loadingHandler = this.dialogV2Service.showLoadingDialog();

    // call create
    this.tabData
      .createOrUpdate(
        CreateViewModifyV2ActionType.CREATE,
        fieldData,
        (error, data) => {
          // hide loading
          loadingHandler.close();

          // handle errors
          if (error) {
            // show error
            this.toastV2Service.error(error);

            // finished
            return;
          }

          // mark all forms as pristine
          this.markFormsAsPristine();

          // redirect after create / update
          this.tabData.redirectAfterCreateUpdate(data);
        }
      );
  }

  /**
   * Update item
   */
  modify(): void {
    // determine forms
    const forms: NgForm[] = this.tabData.tabs.map((tab) => tab.form).filter((item) => !!item);

    // submit to validate forms
    forms.forEach((form) => {
      form.ngSubmit.emit();
    });

    // validate
    if (!this.formHelper.isFormsSetValid(forms)) {
      // show message
      this.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // determine form data
    const fieldData = this.formHelper.mergeDirtyFields(forms);
    if (_.isEmpty(fieldData)) {
      // show message
      this.toastV2Service.success('LNG_FORM_WARNING_NO_CHANGES');

      // finished
      return;
    }

    // show loading
    const loadingHandler = this.dialogV2Service.showLoadingDialog();

    // call create
    this.tabData
      .createOrUpdate(
        CreateViewModifyV2ActionType.UPDATE,
        fieldData,
        (error, data) => {
          // hide loading
          loadingHandler.close();

          // handle errors
          if (error) {
            // show error
            this.toastV2Service.error(error);

            // finished
            return;
          }

          // mark all forms as pristine
          this.markFormsAsPristine();

          // redirect after create / update
          this.tabData.redirectAfterCreateUpdate(data);
        }
      );
  }

  /**
   * Hack to mark an array of items as dirty since ngModelGroup isn't working with arrays
   */
  markArrayItemsAsDirty(
    form: NgForm,
    groupName: string
  ): void {
    // wait for form to catch up
    setTimeout(() => {
      // determine inputs that should become dirty
      Object.keys(form.controls)
        .filter((name) => name.startsWith(`${groupName}[`) || name === groupName)
        .forEach((name) => {
          // mark as dirty
          form.controls[name].markAsDirty();
        });
    });
  }

  /**
   * Track by
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Refresh expand list data
   */
  private expandListRefresh(): void {
    this.expandListRefreshData.emit(this._expandListQueryBuilder);
  }

  /**
   * List filters
   */
  expandListFilter(): void {
    // no advanced filter type set ?
    if (!this.expandListAdvancedFilterType) {
      throw new Error('Advanced filter type missing...');
    }

    // show advanced filters dialog
    this.dialogV2Service
      .showAdvancedFiltersDialog(
        this.expandListAdvancedFilterType,
        this.expandListAdvancedFilters,
        this.expandListAdvancedFiltersApplied
      )
      .subscribe((response) => {
        // cancelled ?
        if (!response) {
          return;
        }

        // set data
        this._expandListQueryBuilder = response.queryBuilder;
        this.expandListAdvancedFiltersApplied = response.filtersApplied;

        // filter
        this.expandListRefresh();
      });
  }

  /**
   * List search
   */
  expandListSearch(): void {
    // search
    // #TODO
    this.expandListRefresh();
  }

  /**
   * Expand collapse list
   */
  expandCollapseList(): void {
    // toggle state
    this.expandList = !this.expandList;

    // nothing to do here anymore ?
    if (
      !this.expandList ||
      this.expandListInitialized
    ) {
      return;
    }

    // retrieve data
    this.expandListRefresh();
  }

  /**
   * Retrieve data
   */
  private expandListRetrieveData(): void {
    // cancel previous one
    this.expandListStopGetRecords();

    // initialized
    this.expandListInitialized = true;

    // show loading
    this.expandListLoadingData = true;
    this.expandListRecordsSubscription = this.expandListRecords$
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe((data) => {
        // finished
        this.expandListRecordsSubscription = undefined;
        this.expandListLoadingData = false;

        // #TODO
        console.log(data);

        // re-render ui
        this.changeDetectorRef.detectChanges();
      });
  }
}
