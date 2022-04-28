import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
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
import { ListComponent } from '../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { StorageService } from '../../../core/services/helper/storage.service';
import { ICachedFilter } from '../../../core/helperClasses/models/cache.model';
import { CreateViewModifyV2ExpandColumn, CreateViewModifyV2ExpandColumnType } from './models/expand-column.model';
import { ICreateViewModifyV2Refresh } from './models/refresh.model';

/**
 * Component
 */
@Component({
  selector: 'app-create-view-modify-v2',
  templateUrl: './app-create-view-modify-v2.component.html',
  styleUrls: ['./app-create-view-modify-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
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

  // selected outbreak is active ?
  @Input() selectedOutbreakIsActive: boolean;

  // loading data
  @Input() loadingPage: boolean;

  // current item id
  @Input() itemID: string;

  // loading item data
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
      if (
        this.tabData.tabs[index].type === CreateViewModifyV2TabInputType.TAB &&
        (this.tabData.tabs[index] as ICreateViewModifyV2Tab).form?.pending
      ) {
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

  // expand list data
  expandListRecords: any[];

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

  // expand list column renderer
  @Input() expandListColumnRenderer: CreateViewModifyV2ExpandColumn;

  // query builder
  private _expandListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

  // advanced filters
  @Input() expandListAdvancedFilterType: string;
  @Input() expandListAdvancedFilters: V2AdvancedFilter[];

  // query fields
  @Input() expandListQueryFields: string[];

  // filters applied
  private _expandListAdvancedFiltersApplied: SavedFilterData;

  // advanced filters cache key
  private _expandListAdvancedFiltersCacheKey: string;
  @Input() set expandListAdvancedFiltersCacheKey(pageKey: string) {
    // set data
    this._expandListAdvancedFiltersCacheKey = pageKey;

    // nothing to do ?
    if (!this._expandListAdvancedFiltersCacheKey) {
      // reset data
      this._expandListAdvancedFiltersApplied = undefined;
      this._expandListQueryBuilder = new RequestQueryBuilder();

      // finished
      return;
    }

    // load cached filters for our page
    const realCacheKey: string = ListComponent.getCachedFiltersPageKey(
      this._expandListAdvancedFiltersCacheKey,
      undefined
    );

    // retrieve storage filters
    const currentUserCache: ICachedFilter = ListComponent.getCachedFiltersFromStorage(
      this.authDataService.getAuthenticatedUser(),
      this.storageService
    );

    // check if we have cached for our page
    if (
      currentUserCache &&
      currentUserCache[realCacheKey]
    ) {
      // set query builder
      if (currentUserCache[realCacheKey].queryBuilder) {
        // reset
        this._expandListQueryBuilder = new RequestQueryBuilder();

        // deserialize
        this._expandListQueryBuilder.deserialize(currentUserCache[realCacheKey].queryBuilder);
      }

      // set query builder
      if (currentUserCache[realCacheKey].sideFilters) {
        // set data
        this._expandListAdvancedFiltersApplied = new SavedFilterData(currentUserCache[realCacheKey].sideFilters);
      }
    }
  }
  get expandListAdvancedFiltersCacheKey(): string {
    return this._expandListAdvancedFiltersCacheKey;
  }

  // refresh data
  @Output() expandListRefreshData = new EventEmitter<ICreateViewModifyV2Refresh>();

  // switch viewed item
  @Output() expandListChangeRecord = new EventEmitter<any>();

  // constants
  CreateViewModifyV2TabInputType = CreateViewModifyV2TabInputType;
  Constants = Constants;
  CreateViewModifyV2MenuType = CreateViewModifyV2MenuType;
  FormHelperService = FormHelperService;
  CreateViewModifyV2ExpandColumnType = CreateViewModifyV2ExpandColumnType;

  /**
   * Constructor
   */
  constructor(
    protected elementRef: ElementRef,
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service,
    protected formHelper: FormHelperService,
    protected toastV2Service: ToastV2Service,
    protected authDataService: AuthDataService,
    protected storageService: StorageService
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
    (this.tabData?.tabs || [])
      .filter((tab) => tab.type === CreateViewModifyV2TabInputType.TAB)
      .forEach((tab: ICreateViewModifyV2Tab) => {
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
    const forms: NgForm[] = this.tabData.tabs
      .filter((tab) => tab.type === CreateViewModifyV2TabInputType.TAB)
      .map((tab: ICreateViewModifyV2Tab) => tab.form).filter((item) => !!item);

    // validate
    if (!this.formHelper.isFormsSetValid(forms)) {
      return;
    }

    // determine form data
    const fieldData = this.formHelper.mergeFields(forms);
    if (_.isEmpty(fieldData)) {
      return;
    }

    // call create
    this.runCreateOrUpdate(
      CreateViewModifyV2ActionType.CREATE,
      fieldData
    );
  }

  /**
   * Update item
   */
  modify(): void {
    // determine forms
    const forms: NgForm[] = this.tabData.tabs
      .filter((tab) => tab.type === CreateViewModifyV2TabInputType.TAB)
      .map((tab: ICreateViewModifyV2Tab) => tab.form).filter((item) => !!item);

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

    // call update
    this.runCreateOrUpdate(
      CreateViewModifyV2ActionType.UPDATE,
      fieldData
    );
  }

  /**
   * Execute create / update
   */
  private runCreateOrUpdate(
    type: CreateViewModifyV2ActionType,
    fieldData: any
  ): void {
    // show loading
    let loadingHandler = this.dialogV2Service.showLoadingDialog();

    // call create
    this.tabData
      .createOrUpdate(
        type,
        fieldData,
        (error, data) => {
          // hide loading
          if (loadingHandler) {
            loadingHandler.close();
            loadingHandler = undefined;
          }

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
        },
        {
          show: () => {
            // already visible ?
            if (loadingHandler) {
              return;
            }

            // show loading
            loadingHandler = this.dialogV2Service.showLoadingDialog();
          },
          hide: () => {
            // hide loading
            if (loadingHandler) {
              loadingHandler.close();
              loadingHandler = undefined;
            }
          }
        },
        {
          markFormsAsPristine: () => {
            // mark all forms as pristine
            this.markFormsAsPristine();
          }
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
    // make sure we add pagination
    this._expandListQueryBuilder.paginator.setPage({
      pageSize: Constants.DEFAULT_PAGE_SIZE,
      pageIndex: 0
    });

    // query only the fields that we need to
    if (
      this.expandListQueryFields &&
      this.expandListQueryFields.length > 0
    ) {
      this._expandListQueryBuilder.clearFields();
      this._expandListQueryBuilder.fields(...this.expandListQueryFields);
    }

    // retrieve data
    this.expandListRefreshData.emit(
      {
        queryBuilder: _.cloneDeep(this._expandListQueryBuilder),
        searchBy: this.expandListSearchValue
      }
    );
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
        this._expandListAdvancedFiltersApplied
      )
      .subscribe((response) => {
        // cancelled ?
        if (!response) {
          return;
        }

        // set data
        this._expandListQueryBuilder = response.queryBuilder ?
          response.queryBuilder :
          new RequestQueryBuilder();
        this._expandListAdvancedFiltersApplied = response.filtersApplied;

        // filter
        this.expandListRefresh();
      });
  }

  /**
   * List search
   */
  expandListSearch(): void {
    // search
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

        // set data
        this.expandListRecords = data;

        // re-render ui
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * View record
   */
  expandListViewRecord(record: any): void {
    this.expandListChangeRecord.emit(record);
  }

  /**
   * Detect changes
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }
}
