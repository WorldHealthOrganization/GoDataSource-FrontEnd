import { Component, OnDestroy, OnInit } from '@angular/core';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs';
import { SavedImportMappingModel } from '../../../../core/models/saved-import-mapping.model';
import { catchError, share } from 'rxjs/operators';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { Constants } from '../../../../core/models/constants';
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-saved-import-mapping',
  templateUrl: './saved-import-mapping.component.html'
})
export class SavedImportMappingComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_TITLE', '.', true)
  // ];

  yesNoOptionsList$: Observable<any[]>;

  pagesWithSavedFilters: LabelValuePair[] = _.map(Constants.APP_IMPORT_PAGE, (page) => {
    return new LabelValuePair(page.label, page.value);
  });

  savedImportMappingsList$: Observable<SavedImportMappingModel[]>;
  savedImportMappingsListCount$: Observable<IBasicCount>;

  // constants
  SavedImportMappingModel = SavedImportMappingModel;

  // user list
  userList$: Observable<UserModel[]>;

  fixedTableColumns: string[] = [
    'name',
    'isPublic',
    'mappingKey',
    'createdBy',
    'updatedBy',
    'updatedAt'
  ];

  recordActions: HoverRowAction[] = [
    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Import
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_DELETE_MAPPING',
          click: (item: SavedImportMappingModel) => {
            this.deleteImportMapping(item.id);
          },
          visible: (item: SavedImportMappingModel): boolean => {
            return !item.readOnly || SavedImportMappingModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private savedImportMappingService: SavedImportMappingService,
    private dialogService: DialogService,
    private genericDataService: GenericDataService,
    private userDataService: UserDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    // initialize pagination
    this.initPaginator();
    // ...and re-load the list
    this.needsRefreshList(true);
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Clusters list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve list
    this.savedImportMappingsList$ = this.savedImportMappingService
      .getImportMappingsList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.savedImportMappingsListCount$ = this.savedImportMappingService
      .getImportMappingsListCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete a saved import mapping
     * @param {string} savedImportId
     */
  deleteImportMapping(savedImportId: string) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SAVED_IMPORT_MAPPING')
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete contact
          this.savedImportMappingService.deleteImportMapping(savedImportId)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Modify public status of a saved import mapping
     * @param {string} savedImportMappingId
     * @param {boolean} isPublic
     */
  setPublicItem(savedImportMappingId: string, isPublic: boolean) {
    this.savedImportMappingService.modifyImportMapping(savedImportMappingId, {isPublic : isPublic})
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE');
      });
  }

}
