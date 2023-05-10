import { Observable, Subscription } from 'rxjs';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { OutbreakModel } from '../models/outbreak.model';
import { Directive, ViewChild } from '@angular/core';
import { OutbreakDataService } from '../services/data/outbreak.data.service';
import { UserModel } from '../models/user.model';
import { AuthDataService } from '../services/data/auth.data.service';
import { V2SpreadsheetEditorColumn } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/column.model';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { IV2SpreadsheetEditorEventSave } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/event.model';
import { ActivatedRoute } from '@angular/router';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import {
  AppSpreadsheetEditorV2Component
} from '../../shared/components-v2/app-spreadsheet-editor-v2/app-spreadsheet-editor-v2.component';

/**
 * Bulk create / modify component
 */
@Directive()
export abstract class BulkCreateModifyComponent<T> extends ConfirmOnFormChanges {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[];

  // authenticated user data
  authUser: UserModel;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  selectedOutbreakSubscription: Subscription;

  // columns
  tableColumns: V2SpreadsheetEditorColumn[];

  // ignore groups
  saveIgnoreGroups: string[];

  // field replace
  saveFieldReplace: {
    [field: string]: string
  };

  // records
  records$: Observable<T[]>;

  // retrieve table handler
  @ViewChild(AppSpreadsheetEditorV2Component, { static: true }) spreadsheetEditorV2Component: AppSpreadsheetEditorV2Component;

  // page type
  // - determined from route data
  readonly action: CreateViewModifyV2Action.CREATE | CreateViewModifyV2Action.MODIFY;
  get isCreate(): boolean {
    return this.action === CreateViewModifyV2Action.CREATE;
  }
  get isModify(): boolean {
    return this.action === CreateViewModifyV2Action.MODIFY;
  }

  // page title
  pageTitle: string;

  // timers
  private _initializeTimer: number;
  private _initializeRecordsTimer: number;

  /**
   * Constructor
   */
  protected constructor(
    protected activatedRoute: ActivatedRoute,
    protected authDataService: AuthDataService,
    protected outbreakDataService: OutbreakDataService,
    private _config: {
      initializeTableColumnsAfterRecordsInitialized: boolean
    }
  ) {
    // parent
    super();

    // get auth data
    this.authUser = authDataService.getAuthenticatedUser();

    // retrieve basic data
    this.action = activatedRoute.snapshot.data.action;

    // wait for binding so some things get processed
    this._initializeTimer = setTimeout(() => {
      // reset
      this._initializeTimer = undefined;

      // initialize page title
      this.initializePageTitle();

      // initialize breadcrumbs
      this.initializeBreadcrumbs();

      // initialize table columns
      if (!this._config.initializeTableColumnsAfterRecordsInitialized) {
        this.initializeTableColumns();
      }

      // initialize ignore groups
      this.initializeSaveIgnoreGroups();

      // initialize field replace
      this.initializeSaveFieldReplace();
    });

    // listen for outbreak selection
    this.selectedOutbreakSubscription = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // ignore empty selection for now, no need to take in account ...de-selection
        if (!selectedOutbreak) {
          return;
        }

        // if same outbreak then don't trigger change
        if (
          this.selectedOutbreak &&
          this.selectedOutbreak.id === selectedOutbreak.id
        ) {
          return;
        }

        // select outbreak
        this.selectedOutbreak = selectedOutbreak;

        // timer - records
        this.stopInitializeRecordsTimer();

        // trigger outbreak selection changed
        // - wait for binding
        this._initializeRecordsTimer = setTimeout(() => {
          // reset
          this._initializeRecordsTimer = undefined;

          // init
          this.initializeRecords();
        });
      });
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // release subscribers
    this.releaseSubscribers();
  }

  /**
   * Initialize page title
   */
  protected abstract initializePageTitle(): void;

  /**
   * Initialize breadcrumbs
   */
  protected abstract initializeBreadcrumbs(): void;

  /**
   * Initialize table columns
   */
  protected abstract initializeTableColumns(): void;

  /**
   * Initialize ignore groups
   */
  protected abstract initializeSaveIgnoreGroups(): void;

  /**
   * Initialize ignore groups
   */
  protected abstract initializeSaveFieldReplace(): void;

  /**
   * Initialize records data
   */
  protected abstract initializeRecords(): void;

  /**
   * Used to generate a new record
   */
  abstract newRecord(): T;

  /**
   * Save handler
   */
  abstract save(event: IV2SpreadsheetEditorEventSave);

  /**
   * Stop timer
   */
  private stopInitializeRecordsTimer(): void {
    // timer - records
    if (this._initializeRecordsTimer) {
      clearTimeout(this._initializeRecordsTimer);
      this._initializeRecordsTimer = undefined;
    }
  }

  /**
   * Release subscribers
   */
  private releaseSubscribers() {
    // selected outbreak
    if (this.selectedOutbreakSubscription) {
      this.selectedOutbreakSubscription.unsubscribe();
      this.selectedOutbreakSubscription = undefined;
    }

    // timer - setup
    if (this._initializeTimer) {
      clearTimeout(this._initializeTimer);
      this._initializeTimer = undefined;
    }

    // timer - records
    this.stopInitializeRecordsTimer();
  }

  /**
   * Records initialized
   */
  recordsInitialized(): void {
    // initialize table columns
    if (this._config.initializeTableColumnsAfterRecordsInitialized) {
      this.initializeTableColumns();
    }
  }
}
