import { Observable, ReplaySubject, throwError } from 'rxjs';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { OutbreakModel } from '../models/outbreak.model';
import { UserModel } from '../models/user.model';
import { ICreateViewModifyV2 } from '../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { ActivatedRoute } from '@angular/router';
import { Directive } from '@angular/core';
import { TopnavComponent } from '../components/topnav/topnav.component';
import { AuthDataService } from '../services/data/auth.data.service';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { BaseModel } from '../models/base.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../services/helper/toast-v2.service';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import { RequestQueryBuilder } from './request-query-builder';

@Directive()
export abstract class CreateViewModifyComponent<T extends BaseModel>
  extends ConfirmOnFormChanges {
  // handler for stopping take until
  protected destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

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
  loadingItemData: boolean = true;

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

  // expanded list records observable
  expandListRecords$: Observable<T[]>;

  /**
   * Constructor
   */
  protected constructor(
    activatedRoute: ActivatedRoute,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service
  ) {
    // initialize parent
    super();

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // get auth data
    this.authUser = authDataService.getAuthenticatedUser();

    // retrieve basic data
    this.action = activatedRoute.snapshot.data.action;

    // retrieve selected outbreak - since on create, view & modify select outbreak dropdown should be disabled
    this.selectedOutbreak = activatedRoute.snapshot.data.outbreak;

    // initialize
    const initialize = () => {
      // initialized data
      this.initializedData();

      // initialize page title
      this.initializePageTitle();

      // initialize breadcrumbs
      this.initializeBreadcrumbs();

      // initialize tabs
      this.initializeTabs();
    };

    // create ?
    this.loadingItemData = true;
    if (this.isCreate) {
      // create
      setTimeout(() => {
        // initialize item
        this.itemData = this.createNewItem();

        // initialize other things
        initialize();

        // not loading anymore
        this.loadingItemData = false;
      });
    } else {
      // view / modify
      // retrieve item data
      setTimeout(() => {
        this.retrieveItem()
          .pipe(
            catchError((err) => {
              // show error
              toastV2Service.error(err);

              // send down
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          )
          .subscribe((data) => {
            // set data
            this.itemData = data;

            // initialize
            initialize();

            // not loading anymore
            this.loadingItemData = false;
          });
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
  protected abstract retrieveItem(): Observable<T>;

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
   * Refresh expand list
   */
  protected abstract refreshExpandList(queryBuilder: RequestQueryBuilder): void;

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
  }
}
