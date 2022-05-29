import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable, Subscription, throwError } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserSettings } from '../../../../core/models/user.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { CotSnapshotModel } from '../../../../core/models/cot-snapshot.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { catchError, share } from 'rxjs/operators';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-transmission-chains-snapshot-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './transmission-chains-snapshot-list.component.html',
  styleUrls: ['./transmission-chains-snapshot-list.component.less']
})
export class TransmissionChainsSnapshotListComponent extends ListComponent<CotSnapshotModel> implements OnInit, OnDestroy {
  // constants
  UserSettings = UserSettings;
  Constants = Constants;

  // list of existing cot snapshots
  cotSnapshotsList$: Observable<CotSnapshotModel[]>;
  cotSnapshotsListCount$: Observable<IBasicCount>;

  // filters
  statusList$: Observable<any>;

  // subscribers
  outbreakSubscriber: Subscription;

  // actions
  recordActions: HoverRowAction[] = [
    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete snapshot
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_ASYNC_COT_ACTION_DELETE_SNAPSHOT',
          click: (item: CotSnapshotModel) => {
            this.deleteSnapshot(item);
          },
          visible: (item: CotSnapshotModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CotSnapshotModel.canDelete(this.authUser);
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
    private outbreakDataService: OutbreakDataService,
    private transmissionChainDataService: TransmissionChainDataService,
    private genericDataService: GenericDataService,
    private dialogService: DialogService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // status options
    this.statusList$ = this.genericDataService.getCotSnapshotStatusList();

    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // selected outbreak
        this.selectedOutbreak = selectedOutbreak;

        // initialize pagination
        this.initPaginator();

        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'startDate',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_START_DATE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'endDate',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_END_DATE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'status',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_STATUS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'fileSize',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_FILE_SIZE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'error',
    //     label: 'LNG_ASYNC_COT_FIELD_LABEL_ERROR'
    //   })
    // ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {}

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Cases list, based on the applied filter, sort criterias
   */
  refreshList() {
    // we need the outbreak to continue
    if (
      !this.selectedOutbreak ||
            !this.selectedOutbreak.id
    ) {
      return;
    }

    // default sort order ?
    if (this.queryBuilder.sort.isEmpty()) {
      this.queryBuilder.sort.by(
        'startDate',
        RequestSortDirection.DESC
      );
    }

    // created by current user
    this.queryBuilder.filter.byEquality(
      'createdBy',
      this.authUser.id
    );

    // retrieve the list of Cases
    this.cotSnapshotsList$ = this.transmissionChainDataService
      .getSnapshotsList(
        this.selectedOutbreak.id,
        this.queryBuilder
      )
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
    // we need the outbreak to continue
    if (
      !this.selectedOutbreak ||
            !this.selectedOutbreak.id
    ) {
      return;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.cotSnapshotsListCount$ = this.transmissionChainDataService
      .getSnapshotsCount(
        this.selectedOutbreak.id,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete item
     */
  deleteSnapshot(cotSnapshotModel: CotSnapshotModel) {
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_DELETE_COT_SNAPSHOT')
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete
          this.transmissionChainDataService
            .deleteSnapshot(
              this.selectedOutbreak.id,
              cotSnapshotModel.id
            )
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // show message
              this.toastV2Service.success('LNG_PAGE_LIST_ASYNC_COT_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }
}
