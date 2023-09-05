import { Observable, Subscription } from 'rxjs';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { OutbreakModel } from '../models/outbreak.model';
import { Directive, ViewChild } from '@angular/core';
import { OutbreakDataService } from '../services/data/outbreak.data.service';
import { UserModel } from '../models/user.model';
import { AuthDataService } from '../services/data/auth.data.service';
import { IV2SpreadsheetEditorColumnValidatorRequired, V2SpreadsheetEditorColumn } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/column.model';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { IV2SpreadsheetEditorEventSave } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/event.model';
import { ActivatedRoute } from '@angular/router';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import {
  AppSpreadsheetEditorV2Component
} from '../../shared/components-v2/app-spreadsheet-editor-v2/app-spreadsheet-editor-v2.component';
import { V2SpreadsheetEditorColumnToVisibleMandatoryConf } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { PersonAndRelatedHelperService } from '../services/helper/person-and-related-helper.service';

/**
 * Bulk create / modify component
 */
@Directive()
export abstract class BulkCreateModifyComponent<T, U extends (V2SpreadsheetEditorColumn | V2SpreadsheetEditorColumnToVisibleMandatoryConf)> extends ConfirmOnFormChanges {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[];

  // authenticated user data
  authUser: UserModel;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  selectedOutbreakSubscription: Subscription;

  // columns
  private _tableColumns: U[];
  get tableColumns(): U[] {
    return this._tableColumns;
  }
  set tableColumns(tableColumns: U[]) {
    // apply required
    const applyRequiredAndVisibility = (items: V2SpreadsheetEditorColumnToVisibleMandatoryConf[]): U[] => {
      // filter
      const filteredItems: V2SpreadsheetEditorColumnToVisibleMandatoryConf[] = [];
      (items || []).forEach((column) => {
        // visible / mandatory ?
        if (!column.visibleMandatory) {
          // add
          filteredItems.push(column);

          // finished
          return;
        }

        // visible ?
        if (this.shouldVisibleMandatoryTableColumnBeVisible(
          column.visibleMandatory.key,
          column.visibleMandatory.field
        )) {
          // must check for required ?
          if (
            this.selectedOutbreak?.visibleAndMandatoryFields &&
            this.selectedOutbreak.visibleAndMandatoryFields[column.visibleMandatory.key] &&
            this.selectedOutbreak.visibleAndMandatoryFields[column.visibleMandatory.key][column.visibleMandatory.field]?.mandatory &&
            !(column.validators as IV2SpreadsheetEditorColumnValidatorRequired)?.required
          ) {
            // must initialize ?
            if (!column.validators) {
              column.validators = {};
            }

            // attach required
            (column.validators as IV2SpreadsheetEditorColumnValidatorRequired).required = () => true;
          }

          // add
          filteredItems.push(column);
        }
      });

      // finished
      return filteredItems as U[];
    };

    // set value
    this._tableColumns = applyRequiredAndVisibility(tableColumns as V2SpreadsheetEditorColumnToVisibleMandatoryConf[]);

    // overwrite push items, otherwise we might push items that shouldn't be visible
    this._tableColumns.push = function(...args) {
      return Array.prototype.push.apply(this, applyRequiredAndVisibility(args as V2SpreadsheetEditorColumnToVisibleMandatoryConf[]));
    };
  }

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

  // initialize table columns after outbreak changed ?
  private _initializeTableColumnAfterOutbreakSelected: boolean = false;

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
    protected personAndRelatedHelperService: PersonAndRelatedHelperService,
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
      // IMPORTANT: we need to call this even if this._config.initializeTableColumnsAfterRecordsInitialized is true because otherwise location columns aren't determined and locations aren't retrieved resulting in displaying ids instead of labels
      this.initializeTableColumns();

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

        // initialize table columns after outbreak changed ?
        if (this._initializeTableColumnAfterOutbreakSelected) {
          this.initializeTableColumns();
          this._initializeTableColumnAfterOutbreakSelected = false;
        }

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
      // outbreak initialized ?
      if (this.selectedOutbreak?.id) {
        this.initializeTableColumns();
      } else {
        // wait for outbreak to initialize
        this._initializeTableColumnAfterOutbreakSelected = true;
      }
    }
  }

  /**
   * Check if a column should be visible depending on outbreak visible/mandatory settings
   */
  private shouldVisibleMandatoryTableColumnBeVisible(
    visibleMandatoryKey: string,
    prop: string
  ): boolean {
    return this.personAndRelatedHelperService.list.shouldVisibleMandatoryTableColumnBeVisible(
      this.selectedOutbreak,
      visibleMandatoryKey,
      prop
    );
  }
}
