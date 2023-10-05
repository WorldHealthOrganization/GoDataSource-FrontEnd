import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { CreateViewModifyV2Action } from './models/action.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2,
  ICreateViewModifyV2Config,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabInputAddress,
  ICreateViewModifyV2TabInputChanged,
  ICreateViewModifyV2TabInputList,
  ICreateViewModifyV2TabTable, ICreateViewModifyV2TabTableRecordsList
} from './models/tab.model';
import { IV2Breadcrumb, IV2BreadcrumbInfo } from '../app-breadcrumb-v2/models/breadcrumb.model';
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
import { Subscription } from 'rxjs/internal/Subscription';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { V2AdvancedFilter } from '../app-list-table-v2/models/advanced-filter.model';
import { SavedFilterData } from '../../../core/models/saved-filters.model';
import { ListComponent } from '../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { StorageService } from '../../../core/services/helper/storage.service';
import { ICachedFilter } from '../../../core/helperClasses/models/cache.model';
import { CreateViewModifyV2ExpandColumn, CreateViewModifyV2ExpandColumnType } from './models/expand-column.model';
import { ICreateViewModifyV2Refresh } from './models/refresh.model';
import { determineRenderMode, RenderMode } from '../../../core/enums/render-mode.enum';
import { IExtendedColDef } from '../app-list-table-v2/models/extended-column.model';
import { applyFilterBy, applyResetOnAllFilters, applySortBy, IV2Column } from '../app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../app-list-table-v2/app-list-table-v2.component';
import { PageEvent } from '@angular/material/paginator';
import { IAppFormIconButtonV2 } from '../../forms-v2/core/app-form-icon-button-v2';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Params } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputGroup,
  IV2SideDialogConfigInputMap,
  IV2SideDialogConfigInputSortList,
  IV2SideDialogData,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../app-side-dialog-v2/models/side-dialog-config.model';
import { determineIfSmallScreenMode } from '../../../core/methods/small-screen-mode';
import { I18nService } from '../../../core/services/helper/i18n.service';

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
  // constants
  private static readonly GENERAL_SETTINGS_TAB_ORDER: string = 'tabsOrder';

  // language handler
  languageSubscription: Subscription;

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
  @Input() allowEdit: boolean;

  // loading data
  @Input() loadingPage: boolean;

  // current item id
  @Input() itemID: string;

  // loading item data
  private _loadingItemData: boolean;
  @Input() set loadingItemData(loadingItemData: boolean) {
    // update loading item data
    this._loadingItemData = loadingItemData;

    // select proper tab
    if (!this.loadingItemData) {
      this.selectTabIfPossible();
    }
  }
  get loadingItemData(): boolean {
    return this._loadingItemData;
  }

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];
  @Input() breadcrumbInfos: IV2BreadcrumbInfo[];

  // title
  @Input() pageTitle: string;
  @Input() pageTitleData: {
    [key: string]: string
  };

  // retrieve all form data ?
  @Input() retrieveAllFormDataOnModify: boolean;

  // tabs to render
  private _tabsDefaultOrder: {
    [tabKey: string]: number
  } = {};
  private _tabData: ICreateViewModifyV2;
  @Input() set tabData(tabData: ICreateViewModifyV2) {
    // set data
    this._tabData = tabData;
    this._tabsDefaultOrder = {};

    // set update ui methods
    (this.tabData?.tabs || []).forEach((tab, tabIndex) => {
      // keep default tab order
      this._tabsDefaultOrder[tab.name || tab.label] = tabIndex;

      // map inputs
      if (tab.type === CreateViewModifyV2TabInputType.TAB) {
        tab.nameToInput = {};
        tab.sections?.forEach((section) => {
          section.inputs?.forEach((input) => {
            // nothing to do ?
            const inputWithName: {
              name?: string
            } = input as {
              name?: string
            };
            if (!inputWithName.name) {
              return;
            }

            // map
            tab.nameToInput[inputWithName.name] = input;
          });
        });
      }

      // not important ?
      if (tab.type !== CreateViewModifyV2TabInputType.TAB_TABLE) {
        return;
      }

      // attach update ui method
      if (tab.definition.type === CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
        tab.definition.updateUI = () => {
          this.detectChanges();
        };
      }
    });

    // update settings
    this.loadPageSettings();

    // select tab if necessary
    this.selectTabIfPossible();
  }
  get tabData(): ICreateViewModifyV2 {
    return this._tabData;
  }

  // mat tab group (view / modify page)
  private _matTabGroup: MatTabGroup;
  @ViewChild(MatTabGroup) set matTabGroup(matTabGroup: MatTabGroup) {
    // update value
    this._matTabGroup = matTabGroup;

    // select tab if necessary
    this.selectTabIfPossible();
  }
  get matTabGroup(): MatTabGroup {
    return this._matTabGroup;
  }

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

  // page index
  expandListPageIndex: number = 0;
  expandListPageCount: {
    count: number
  } = {
      count: 0
    };

  // show search by input ?
  @Input() showSearchByInput: boolean = true;

  // search
  expandListSearchValue: string;
  expandListSearchValueTimeout: number;
  expandListSearchSuffixButtons: IAppFormIconButtonV2[] = [
    {
      icon: 'clear',
      clickAction: () => {
        // nothing to do ?
        if (!this.expandListSearchValue) {
          return;
        }

        // reset
        this.expandListPageIndex = 0;
        this.expandListSearchValue = '';

        // remove previous request
        this.expandListStopSearchApply();

        // sort
        this.expandListRefresh();
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
    this._expandListRecords$ = expandListRecords$ ?
      expandListRecords$.pipe(map((data) => {
        // check if we have more than one page
        this.expandListPageCount = {
          count: (this.expandListPageIndex * Constants.DEFAULT_PAGE_SIZE) + data.length
        };

        // remove the last one if it was retrieve just to know that we have more pages
        // one more - Constants.DEFAULT_PAGE_SIZE + 1
        if (data.length > Constants.DEFAULT_PAGE_SIZE) {
          data.splice(Constants.DEFAULT_PAGE_SIZE);
        }

        // finished
        return data;
      })) :
      expandListRecords$;

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

  // visited tabs
  selectedTab: ICreateViewModifyV2Tab | ICreateViewModifyV2TabTable;
  selectedTabParams: {
    selectedTab: string
  } = this.activatedRoute.snapshot.queryParams?.selectedTab ? {
      selectedTab: this.activatedRoute.snapshot.queryParams.selectedTab
    } : undefined;
  visitedTabs: {
    [tabLabel: string]: true
  } = {};

  // invalid drag zone
  private _isInvalidDragEvent: boolean = true;

  // enable tabs reordering
  private _enableTabReorder: boolean = false;
  @Input() set enableTabReorder(enableTabReorder: boolean) {
    // set value
    this._enableTabReorder = enableTabReorder;

    // update settings
    this.loadPageSettings();
  }
  get enableTabReorder(): boolean {
    return this._enableTabReorder;
  }

  // custom tab configuration settings
  @Input() tabConfiguration: ICreateViewModifyV2Config;

  // user settings key
  private _pageSettingsKey: string;
  @Input() set pageSettingsKey(pageSettingsKey: string) {
    // set value
    this._pageSettingsKey = pageSettingsKey;

    // update settings
    this.loadPageSettings();
  }
  get pageSettingsKey(): string {
    return this._pageSettingsKey;
  }

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // small screen mode ?
  isSmallScreenMode: boolean = false;

  // refresh data
  @Output() expandListRefreshData = new EventEmitter<ICreateViewModifyV2Refresh>();

  // switch viewed item
  @Output() expandListChangeRecord = new EventEmitter<any>();

  // timers
  private _resizeTableTimer: number;
  private _markArrayItemsAsDirtyTimer: number;
  private _detectChangesTimer: number;

  // constants
  CreateViewModifyV2TabInputType = CreateViewModifyV2TabInputType;
  Constants = Constants;
  CreateViewModifyV2MenuType = CreateViewModifyV2MenuType;
  FormHelperService = FormHelperService;
  CreateViewModifyV2ExpandColumnType = CreateViewModifyV2ExpandColumnType;
  RenderMode = RenderMode;
  AppListTableV2Component = AppListTableV2Component;

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
    protected storageService: StorageService,
    protected activatedRoute: ActivatedRoute,
    protected i18nService: I18nService
  ) {}

  /**
   * Initialize resources
   */
  ngOnInit(): void {
    // update render mode
    this.updateRenderMode();

    // subscribe to language change
    this.initializeLanguageChangeListener();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // stop retrieving data
    this.expandListStopGetRecords();

    // stop refresh list from search typing
    this.expandListStopSearchApply();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // stop timers
    this.stopResizeTableTimer();
    this.stopMarkArrayItemsAsDirtyTimer();
    this.stopDetectChangesTimer();
    this.tabData?.tabs?.forEach((tab) => {
      // no need to stop anything ?
      if (tab.type !== CreateViewModifyV2TabInputType.TAB_TABLE) {
        return;
      }

      // cancel requests
      if ((tab.definition as ICreateViewModifyV2TabTableRecordsList).previousRefreshRequest) {
        clearTimeout((tab.definition as ICreateViewModifyV2TabTableRecordsList).previousRefreshRequest);
        (tab.definition as ICreateViewModifyV2TabTableRecordsList).previousRefreshRequest = undefined;
      }
    });
  }

  /**
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // update ui
        this.detectChanges();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
    }
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
   * Stop resize table timer
   */
  private stopResizeTableTimer(): void {
    if (this._resizeTableTimer) {
      clearTimeout(this._resizeTableTimer);
      this._resizeTableTimer = undefined;
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
      if (
        this.isCreate ||
        this.isModify
      ) {
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
   * Trigger changed method if we have one assigned
   */
  triggerListInputChanged(
    input: ICreateViewModifyV2TabInputChanged,
    itemIndex?: number,
    form?: NgForm,
    groupName?: string
  ): void {
    // mark all items as dirty
    if (groupName) {
      this.markArrayItemsAsDirty(
        form,
        groupName
      );
    }

    // nothing to do ?
    if (!input.changed) {
      return;
    }

    // trigger change
    input.changed(
      input,
      itemIndex
    );
  }

  /**
   * Update form
   */
  updateForm(
    tab: ICreateViewModifyV2Tab | ICreateViewModifyV2TabTable,
    form: NgForm
  ): void {
    tab.form = form;
  }

  /**
   * Address location changed
   */
  addressLocationChanged(
    input: ICreateViewModifyV2TabInputAddress,
    locationInfo: ILocation,
    parentInput?: ICreateViewModifyV2TabInputList,
    parentItemIndex?: number
  ): void {
    // should we copy location lat & lng ?
    if (
      locationInfo &&
      locationInfo.geoLocation &&
      locationInfo.geoLocation.lat &&
      locationInfo.geoLocation.lng && (
        !input.visibleMandatoryChild?.visible ||
        input.visibleMandatoryChild.visible('geoLocation')
      ) && (
        !parentInput?.visibleMandatoryChild?.visible ||
        parentInput.visibleMandatoryChild.visible('geoLocation')
      )
    ) {
      this.dialogV2Service
        .showConfirmDialog({
          config: {
            title: {
              get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
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
          const address: AddressModel = input.value.get(parentItemIndex);
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
      .forEach((tab) => {
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
      .map((tab) => tab.form)
      .filter((item) => !!item);

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
      .map((tab) => tab.form)
      .filter((item) => !!item);

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
    const fieldData = this.retrieveAllFormDataOnModify ?
      this.formHelper.mergeFields(forms) :
      this.formHelper.mergeDirtyFields(forms);
    if (_.isEmpty(fieldData)) {
      // show message
      this.toastV2Service.success('LNG_FORM_WARNING_NO_CHANGES');

      // finished
      return;
    }

    // call update
    this.runCreateOrUpdate(
      CreateViewModifyV2ActionType.UPDATE,
      this.tabData.modifyGetAllNotOnlyDirtyFields ?
        this.formHelper.mergeFields(forms) :
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
          this.tabData.redirectAfterCreateUpdate(
            data,
            this.isModify ?
              this.selectedTabParams :
              undefined
          );
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
   * Stop timer
   */
  private stopMarkArrayItemsAsDirtyTimer(): void {
    if (this._markArrayItemsAsDirtyTimer) {
      clearTimeout(this._markArrayItemsAsDirtyTimer);
      this._markArrayItemsAsDirtyTimer = undefined;
    }
  }

  /**
   * Hack to mark an array of items as dirty since ngModelGroup isn't working with arrays
   */
  markArrayItemsAsDirty(
    form: NgForm,
    groupName: string
  ): void {
    // stop previous
    this.stopMarkArrayItemsAsDirtyTimer();

    // wait for form to catch up
    this._markArrayItemsAsDirtyTimer = setTimeout(() => {
      // reset
      this._markArrayItemsAsDirtyTimer = undefined;

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
    this._expandListQueryBuilder.paginator.retrieveOneMore = true;
    this._expandListQueryBuilder.paginator.setPage({
      // +1 to know that we have more pages
      pageSize: Constants.DEFAULT_PAGE_SIZE,
      pageIndex: this.expandListPageIndex
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
   * Change expand list page
   */
  expandListSetPage(page: PageEvent): void {
    // set page
    this.expandListPageIndex = page.pageIndex;

    // refresh page
    this.expandListRefresh();
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

        // reset
        this.expandListPageIndex = 0;

        // filter
        this.expandListRefresh();
      });
  }

  /**
   * Stop refresh list from search typing
   */
  private expandListStopSearchApply(): void {
    if (this.expandListSearchValueTimeout) {
      clearTimeout(this.expandListSearchValueTimeout);
      this.expandListSearchValueTimeout = undefined;
    }
  }

  /**
   * List search
   */
  expandListSearch(): void {
    // remove previous request
    this.expandListStopSearchApply();

    // search
    this.expandListSearchValueTimeout = setTimeout(() => {
      // reset
      this.expandListSearchValueTimeout = undefined;
      this.expandListPageIndex = 0;

      // search
      this.expandListRefresh();
    }, 500);
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

    // reset
    this.expandListPageIndex = 0;

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
    // reset visited tabs
    this.visitedTabs = {};

    // update url
    this.updateURL(this.expandListColumnRenderer.link(record).join('/'));

    // change
    this.expandListChangeRecord.emit(record);
  }

  /**
   * Detect changes
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Refresh tab list
   */
  refreshTabList(
    tab: ICreateViewModifyV2TabTable,
    instant: boolean
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // cancel previous request
    if (tab.definition.previousRefreshRequest) {
      clearTimeout(tab.definition.previousRefreshRequest);
      tab.definition.previousRefreshRequest = undefined;
    }

    // refresh
    if (instant) {
      tab.definition.refresh(tab);
    } else {
      tab.definition.previousRefreshRequest = setTimeout((function(localTab) {
        return () => {
          // reset
          (localTab.definition as ICreateViewModifyV2TabTableRecordsList).previousRefreshRequest = undefined;

          // applies only for records lists
          if (localTab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
            return;
          }

          // refresh
          localTab.definition.refresh(tab);
        };
      })(tab), Constants.DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS);
    }
  }

  /**
   * Visit tab
   */
  visitTab(visibleTabIndex: number): void {
    // determine tab
    const visibleTabs = this.tabData.tabs.filter((tab) => !tab.visible || tab.visible());
    const tab: ICreateViewModifyV2Tab | ICreateViewModifyV2TabTable = visibleTabs[visibleTabIndex];

    // trigger tab changed
    this.selectedTab = tab;
    this.selectedTabParams = {
      selectedTab: this.selectedTab?.name || this.selectedTab?.label
    };

    // update query url
    this.updateURL(window.location.href
      .replace(/&?selectedTab=([^&]+)/i, '')
      .replace(/\?$/, '')
      .replace(/\?&/, '?')
    );

    // already visited ?
    if (this.visitedTabs[tab.label]) {
      return;
    }

    // set visited
    this.visitedTabs[tab.label] = true;

    // trigger first refresh if of type table
    if (tab.type === CreateViewModifyV2TabInputType.TAB_TABLE) {
      this.refreshTabList(
        tab,
        true
      );
    }
  }

  /**
   * Tab page change
   */
  tabListPageChange(
    tab: ICreateViewModifyV2TabTable,
    page: PageEvent
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // update API pagination params
    tab.definition.queryBuilder.paginator.setPage(page);

    // update page index
    tab.definition.pageIndex = tab.definition.queryBuilder.paginator.skip / tab.definition.queryBuilder.paginator.limit;

    // refresh list
    this.refreshTabList(
      tab,
      true
    );
  }

  /**
   * Tab sort by
   */
  tabListSortBy(
    listTable: AppListTableV2Component,
    tab: ICreateViewModifyV2TabTable,
    data: {
      field: string,
      direction: RequestSortDirection
    }
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // apply sort
    applySortBy(
      data,
      tab.definition.queryBuilder,
      listTable.advancedFiltersQueryBuilder,
      undefined
    );

    // refresh list
    this.refreshTabList(
      tab,
      false
    );
  }

  /**
   * Tab filter by
   */
  tabListFilterBy(
    tab: ICreateViewModifyV2TabTable,
    data: {
      column: IExtendedColDef,
      valueOverwrite?: any
    }
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // filter
    // always a column of type IV2Column if we have a filter
    applyFilterBy(
      tab.definition.queryBuilder,
      data.column.columnDefinition as IV2Column,
      data.valueOverwrite
    );

    // refresh
    this.refreshTabList(
      tab,
      false
    );
  }

  /**
   * Reset Header filters
   */
  tabListResetHeaderFilters(
    listTable: AppListTableV2Component,
    tab: ICreateViewModifyV2TabTable
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // clear query builder of conditions and sorting criteria
    tab.definition.queryBuilder.clear();

    // clear table filters
    applyResetOnAllFilters(tab.definition.tableColumns);
    listTable.updateColumnDefinitions();

    // reset table sort columns
    listTable.columnSortBy(
      null,
      null,
      null
    );

    // initialize query paginator
    tab.definition.queryBuilder.paginator.setPage({
      pageSize: tab.definition.queryBuilder.paginator.limit ?
        tab.definition.queryBuilder.paginator.limit :
        Constants.DEFAULT_PAGE_SIZE,
      pageIndex: 0
    }, true);

    // update page index
    tab.definition.pageIndex = 0;

    // retrieve Side filters
    let queryBuilder;
    if ((queryBuilder = listTable.advancedFiltersQueryBuilder)) {
      tab.definition.queryBuilder.merge(queryBuilder);
    }

    // if no side query builder then clear side filters too
    if (!queryBuilder) {
      listTable.generateFiltersFromFilterData(undefined);
    }

    // refresh
    this.refreshTabList(
      tab,
      true
    );
  }

  /**
   * Tab filter by - advanced
   */
  tabListFilterByAdvanced(
    listTable: AppListTableV2Component,
    tab: ICreateViewModifyV2TabTable,
    queryBuilder?: RequestQueryBuilder
  ): void {
    // applies only for records lists
    if (tab.definition.type !== CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST) {
      return;
    }

    // clear query builder of conditions and sorting criteria
    tab.definition.queryBuilder.clear();

    // clear table filters
    applyResetOnAllFilters(tab.definition.tableColumns);
    listTable.updateColumnDefinitions();

    // reset table sort columns
    listTable.columnSortBy(
      null,
      null,
      null
    );

    // initialize query paginator
    tab.definition.queryBuilder.paginator.setPage({
      pageSize: tab.definition.queryBuilder.paginator.limit ?
        tab.definition.queryBuilder.paginator.limit :
        Constants.DEFAULT_PAGE_SIZE,
      pageIndex: 0
    }, true);

    // update page index
    tab.definition.pageIndex = 0;

    // merge query builder with side filters
    if (queryBuilder) {
      tab.definition.queryBuilder.merge(queryBuilder);
    }

    // refresh
    this.refreshTabList(
      tab,
      true
    );
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();

    // determine
    const isSmallScreenMode = determineIfSmallScreenMode();

    // update column definitions only if responsive changes
    if (isSmallScreenMode !== this.isSmallScreenMode) {
      // small screen mode ?
      this.isSmallScreenMode = isSmallScreenMode;
      this.detectChanges();

      // update table size
      this.resizeTable();

      // stop previous
      this.stopResizeTableTimer();

      // wait for html to be rendered since isSmallScreenMode was changed
      this._resizeTableTimer = setTimeout(() => {
        // reset
        this._resizeTableTimer = undefined;

        // update
        this.resizeTable();
      });
    } else {
      // update table size
      this.resizeTable();
    }
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
  dropItem(
    event: CdkDragDrop<any[]>,
    input: ICreateViewModifyV2TabInputList,
    form: NgForm
  ): void {
    // stop ?
    if (this._isInvalidDragEvent) {
      return;
    }

    // disable drag
    this._isInvalidDragEvent = true;
    moveItemInArray(
      input.items,
      event.previousIndex,
      event.currentIndex
    );

    // trigger items changed
    if (input.itemsChanged) {
      input.itemsChanged(input);
    }

    // mark list as dirty
    this.markArrayItemsAsDirty(
      form,
      input.name
    );

    // update ui
    this.detectChanges();
  }

  /**
   * Drag started
   */
  dragStarted(): void {
    // stop ?
    if (this._isInvalidDragEvent) {
      document.dispatchEvent(new Event('mouseup'));
    }
  }

  /**
   * Retrieve tab query params with selected tab info too
   */
  retrieveSelectedTabQueryParams(baseParams: Params): Params {
    // attach selected tab info
    return {
      ...baseParams,
      ...this.selectedTabParams
    };
  }

  /**
   * Select tab if possible
   */
  selectTabIfPossible(): void {
    // do we have everything we need ?
    if (
      !this.matTabGroup ||
      !this.tabData?.tabs?.length ||
      !this.selectedTabParams?.selectedTab
    ) {
      return;
    }

    // check if we can select tab
    const visibleTabs = this.tabData.tabs.filter((tab) => !tab.visible || tab.visible());
    const tabIndex: number = visibleTabs.findIndex((tab) => tab.name === this.selectedTabParams.selectedTab || tab.label === this.selectedTabParams.selectedTab);
    if (tabIndex > -1) {
      // select tab
      this.matTabGroup.selectedIndex = tabIndex;
    } else {
      // reset
      this.selectedTabParams = undefined;

      // update query url
      this.updateURL(window.location.href
        .replace(/&?selectedTab=([^&]+)/i, '')
        .replace(/\?$/, '')
        .replace(/\?&/, '?')
      );
    }
  }

  /**
   * Update URL
   */
  updateURL(url: string): void {
    // update url
    const linkUrl: string = url +
      (
        this.selectedTabParams?.selectedTab ?
          `${url.indexOf('?') > -1 ? '&' : '?'}selectedTab=${this.selectedTabParams.selectedTab}` :
          ''
      );
    window.history.replaceState(
      {},
      '',
      linkUrl
    );
  }

  /**
   * Load page settings
   */
  private loadPageSettings(): void {
    // nothing to do ?
    if (!this.pageSettingsKey) {
      return;
    }

    // order tabs
    this.updateTabsOrder();

    // update ui
    this.detectChanges();
  }

  /**
   * Load and update tabs order
   */
  private updateTabsOrder(): void {
    // nothing to do ?
    if (
      !this.enableTabReorder ||
      !this.pageSettingsKey ||
      !this.tabData?.tabs?.length
    ) {
      return;
    }

    // do we have tabs order already saved ?
    const generalSettings: {
      [key: string]: any
    } = this.authDataService
      .getAuthenticatedUser()
      .getSettings(this.pageSettingsKey);
    const tabsOrder: string[] = generalSettings ?
      generalSettings[AppCreateViewModifyV2Component.GENERAL_SETTINGS_TAB_ORDER] :
      undefined;

    // nothing to do ?
    if (!tabsOrder) {
      return;
    }

    // convert to easily sort tabs
    // - could just do a flip
    const tabsOrderMap: {
      [tabKey: string]: number
    } = {};
    tabsOrder.forEach((tabKey, tabIndex) => {
      tabsOrderMap[tabKey] = tabIndex;
    });

    // order tabs
    this.tabData.tabs.sort((tab1, tab2) => {
      // determine tab order position
      const tab1Position: number = tabsOrderMap[tab1.name || tab1.label] ?? this._tabsDefaultOrder[tab1.name || tab1.label];
      const tab2Position: number = tabsOrderMap[tab2.name || tab2.label] ?? this._tabsDefaultOrder[tab2.name || tab2.label];

      // no information about tabs order ?
      return tab1Position - tab2Position;
    });
  }

  /**
   * Stop timer
   */
  private stopDetectChangesTimer(): void {
    if (this._detectChangesTimer) {
      clearTimeout(this._detectChangesTimer);
      this._detectChangesTimer = undefined;
    }
  }

  /**
   * Configure tabs
   */
  configureTabs(): void {
    // construct list of configurable inputs
    const inputs: V2SideDialogConfigInput[] = [];

    // do we have custom tab configuration ?
    if (this.tabConfiguration?.inputs?.length) {
      inputs.push(
        {
          type: V2SideDialogConfigInputType.GROUP,
          name: 'tabConfig',
          inputs: _.cloneDeep(this.tabConfiguration.inputs)
        }
      );
    }

    // is tab ordering enabled ?
    if (this.enableTabReorder) {
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_COMMON_LABEL_TABS_ORDER'
        },
        {
          type: V2SideDialogConfigInputType.SORT_LIST,
          name: 'sortedItems',
          items: this.tabData.tabs.map((tab) => ({
            label: tab.label,
            value: tab.name || tab.label
          }))
        }
      );
    }

    // display dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_COMMON_LABEL_TABS_SETTINGS'
        },
        hideInputFilter: true,
        inputs,
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_APPLY',
          color: 'primary'
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // show loading while saving the new order
        response.handler.loading.show();

        // finish handler
        const finished = () => {
          // close dialog
          response.handler.hide();
        };

        // handle tab custom configuration
        const handleConfSettings = () => {
          // there is no point in continuing if we don't have custom tab configuration ?
          if (!this.tabConfiguration?.inputs?.length) {
            finished();
            return;
          }

          // map inputs
          const confInputs = (response.data.map.tabConfig as IV2SideDialogConfigInputGroup).inputs;
          const confDataMap: IV2SideDialogConfigInputMap = {};
          confInputs.forEach((item) => {
            confDataMap[item.name] = item;
          });
          const confData: IV2SideDialogData = {
            inputs: confInputs,
            map: confDataMap,
            echo: null
          };

          // update tab configuration values to those that were applied
          this.tabConfiguration.inputs = confInputs;

          // handle tab custom configuration
          this.tabConfiguration.apply(
            confData,
            () => {
              finished();
            }
          );
        };

        // is tab ordering enabled ?
        if (this.enableTabReorder) {
          // determine tabs order
          const tabsOrder: string[] = (response.data.map.sortedItems as IV2SideDialogConfigInputSortList).items
            .map((item) => item.value);

          // update settings
          this.authDataService
            .updateSettingsForCurrentUser({
              [`${this.pageSettingsKey}.${AppCreateViewModifyV2Component.GENERAL_SETTINGS_TAB_ORDER}`]: tabsOrder
            })
            .pipe(
              catchError((err) => {
                // error
                this.toastV2Service.error(err);

                // send error down the road
                return throwError(err);
              })
            )
            .subscribe(() => {
              // update settings
              this.loadPageSettings();

              // not really necessary
              this.stopDetectChangesTimer();

              // hack to fix tab drawing issue when you move a tab before the selected tab
              this.loadingPage = true;
              this._detectChangesTimer = setTimeout(() => {
                // reset
                this._detectChangesTimer = undefined;

                // update
                this.loadingPage = false;
                this.detectChanges();
              });

              // handle custom tab configuration inputs
              handleConfSettings();
            });
        } else {
          // handle custom tab configuration inputs
          handleConfSettings();
        }
      });
  }
}
