import { Observable, Subscription } from 'rxjs';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { OutbreakModel } from '../models/outbreak.model';
import { Directive } from '@angular/core';
import { OutbreakDataService } from '../services/data/outbreak.data.service';
import { UserModel } from '../models/user.model';
import { AuthDataService } from '../services/data/auth.data.service';
import { V2SpreadsheetEditorColumn } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/column.model';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { IV2SpreadsheetEditorEventSave } from '../../shared/components-v2/app-spreadsheet-editor-v2/models/event.model';
import { ActivatedRoute } from '@angular/router';

/**
 * Bulk create / modify component
 */
@Directive()
export abstract class BulkCreateModifyComponent<T> {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[];

  // authenticated user data
  authUser: UserModel;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  selectedOutbreakSubscription: Subscription;

  // columns
  tableColumns: V2SpreadsheetEditorColumn[];

  // records
  records$: Observable<T[]>;

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

  /**
   * Constructor
   */
  protected constructor(
    protected activatedRoute: ActivatedRoute,
    protected authDataService: AuthDataService,
    protected outbreakDataService: OutbreakDataService
  ) {
    // get auth data
    this.authUser = authDataService.getAuthenticatedUser();

    // retrieve basic data
    this.action = activatedRoute.snapshot.data.action;

    // wait for binding so some things get processed
    setTimeout(() => {
      // initialize page title
      this.initializePageTitle();

      // initialize breadcrumbs
      this.initializeBreadcrumbs();

      // initialize table columns
      this.initializeTableColumns();
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

        // trigger outbreak selection changed
        // - wait for binding
        setTimeout(() => {
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
   * Release subscribers
   */
  private releaseSubscribers() {
    // selected outbreak
    if (this.selectedOutbreakSubscription) {
      this.selectedOutbreakSubscription.unsubscribe();
      this.selectedOutbreakSubscription = undefined;
    }
  }
}
