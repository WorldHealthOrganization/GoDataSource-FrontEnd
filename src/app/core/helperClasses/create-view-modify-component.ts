import { Observable, ReplaySubject, throwError } from 'rxjs';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { OutbreakModel } from '../models/outbreak.model';
import { UserModel, UserSettings } from '../models/user.model';
import { ICreateViewModifyV2, ICreateViewModifyV2Config } from '../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { ActivatedRoute } from '@angular/router';
import { Directive, Renderer2, ViewChild } from '@angular/core';
import { TopnavComponent } from '../components/topnav/topnav.component';
import { AuthDataService } from '../services/data/auth.data.service';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../services/helper/toast-v2.service';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import { Constants } from '../models/constants';
import { V2AdvancedFilter } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { CreateViewModifyV2ExpandColumn } from '../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { ICreateViewModifyV2Refresh } from '../../shared/components-v2/app-create-view-modify-v2/models/refresh.model';
import { RedirectService } from '../services/helper/redirect.service';
import { AppCreateViewModifyV2Component } from '../../shared/components-v2/app-create-view-modify-v2/app-create-view-modify-v2.component';

@Directive()
export abstract class CreateViewModifyComponent<T>
  extends ConfirmOnFormChanges {
  // handler for stopping take until
  protected destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

  // retrieve tabs handler
  @ViewChild(AppCreateViewModifyV2Component, { static: true }) tabsV2Component: AppCreateViewModifyV2Component;

  // page title
  pageTitle: string;
  pageTitleData: {
    [key: string]: string
  };

  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[];

  // authenticated user data
  authUser: UserModel;

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  // item data
  itemData: T;

  // loading page / item data
  loadingPage: boolean = true;
  loadingItemData: boolean = false;

  // check if selected outbreak is the active one
  get selectedOutbreakIsActive(): boolean {
    return this.authUser &&
      this.selectedOutbreak &&
      this.selectedOutbreak.id &&
      this.selectedOutbreak.id === this.authUser.activeOutbreakId;
  }

  // page type
  // - determined from route data
  readonly action: CreateViewModifyV2Action;
  get isCreate(): boolean {
    return this.action === CreateViewModifyV2Action.CREATE;
  }
  get isView(): boolean {
    return this.action === CreateViewModifyV2Action.VIEW;
  }
  get isModify(): boolean {
    return this.action === CreateViewModifyV2Action.MODIFY;
  }

  // tabs
  tabData: ICreateViewModifyV2;

  // tab configuration
  tabConfiguration: ICreateViewModifyV2Config;

  // expanded list records observable
  expandListRecords$: Observable<T[]>;

  // expand list column renderer;
  expandListColumnRenderer: CreateViewModifyV2ExpandColumn;

  // expand query fields
  expandListQueryFields: string[];

  // advanced filters
  expandListAdvancedFilters: V2AdvancedFilter[];

  // click listener
  private _clickListener: () => void;

  // constants
  Constants = Constants;
  UserSettings = UserSettings;

  /**
   * Constructor
   */
  protected constructor(
    protected toastV2Service: ToastV2Service,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    activatedRoute: ActivatedRoute,
    authDataService: AuthDataService,
    dontDisableOutbreakSelect?: boolean
  ) {
    // initialize parent
    super();

    // disable select outbreak
    if (!dontDisableOutbreakSelect) {
      TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;
    }

    // get auth data
    this.authUser = authDataService.getAuthenticatedUser();

    // retrieve basic data
    this.action = activatedRoute.snapshot.data.action;

    // retrieve selected outbreak - since on create, view & modify select outbreak dropdown should be disabled
    this.selectedOutbreak = activatedRoute.snapshot.data.outbreak;

    // create ?
    this.loadingPage = true;
    if (this.isCreate) {
      // create
      setTimeout(() => {
        // initialize item
        this.itemData = this.createNewItem();

        // initialize other things
        this.initializeData();

        // not loading anymore
        this.loadingPage = false;
        this.loadingItemData = false;
      });
    } else {
      // view / modify
      // retrieve item data
      setTimeout(() => {
        this.getData(this.retrieveItem());
      });
    }
  }

  /**
   * On destroy handler
   */
  abstract ngOnDestroy(): void;

  /**
   * Initialize new item
   */
  protected abstract createNewItem(): T;

  /**
   * Initialize page title
   */
  protected abstract retrieveItem(record?: T): Observable<T>;

  /**
   * Initialized data
   */
  protected abstract initializedData(): void;

  /**
   * Initialize page title
   */
  protected abstract initializePageTitle(): void;

  /**
   * Initialize breadcrumbs
   */
  protected abstract initializeBreadcrumbs(): void;

  /**
   * Initialize tabs
   */
  protected abstract initializeTabs(): void;

  /**
   * Initialize expand list column renderer fields
   */
  protected abstract initializeExpandListColumnRenderer(): void;

  /**
   * Initialize expand list query fields
   */
  protected abstract initializeExpandListQueryFields(): void;

  /**
   * Initialize expand list advanced filters
   */
  protected abstract initializeExpandListAdvancedFilters(): void;

  /**
   * Refresh expand list
   */
  protected abstract refreshExpandList(data: ICreateViewModifyV2Refresh): void;

  /**
   * Release resources
   */
  onDestroy(): void {
    // unsubscribe other requests
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.destroyed$ = undefined;

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;

    // remove click listener
    if (this._clickListener) {
      this._clickListener();
      this._clickListener = undefined;
    }
  }

  /**
   * Initialize data
   */
  private initializeData(): void {
    // initialized data
    this.initializedData();

    // initialize page title
    this.initializePageTitle();

    // initialize breadcrumbs
    this.initializeBreadcrumbs();

    // initialize tabs
    this.initializeTabs();

    // initialize expanded list column renderer
    this.initializeExpandListColumnRenderer();

    // initialize expanded list query fields
    this.initializeExpandListQueryFields();

    // initialize advanced filters
    this.initializeExpandListAdvancedFilters();

    // listen for href clicks
    this._clickListener = this.renderer2.listen(
      document,
      'click',
      (event) => {
        // not a link that we need to handle ?
        if (
          !event.target?.parentElement?.classList?.contains ||
          !event.target.parentElement.classList.contains('gd-alert-link')
        ) {
          return;
        }

        // stop propagation
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // redirect
        this.redirectService.to([event.target.parentElement.getAttribute('href')]);
      }
    );
  }

  /**
   * Switch to a different record
   */
  expandListChangeRecord(record: T): void {
    // show loading
    this.loadingItemData = true;

    // retrieve item
    this.getData(
      this.retrieveItem(record)
    );
  }

  /**
   * Actual retrieval of data
   */
  private getData(observer$: Observable<T>): void {
    observer$.pipe(
      catchError((err) => {
        // show error
        this.toastV2Service.error(err);

        // send down
        return throwError(err);
      }),

      // should be the last pipe
      takeUntil(this.destroyed$)
    ).subscribe((data) => {
      // set data
      this.itemData = data;

      // initialize
      this.initializeData();

      // not loading anymore
      this.loadingPage = false;
      this.loadingItemData = false;
    });
  }
}
