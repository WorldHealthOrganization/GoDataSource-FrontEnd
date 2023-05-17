import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { RestoreLogDataService } from '../../../../core/services/data/restore-log.data.service';
import { RestoreLogModel } from '../../../../core/models/restore-log.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { BackupModel } from '../../../../core/models/backup.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ActivatedRoute } from '@angular/router';
import { UserModel } from '../../../../core/models/user.model';
import * as moment from 'moment';

@Component({
  selector: 'app-backups-restores',
  templateUrl: './backups-restores.component.html'
})
export class BackupsRestoresComponent extends ListComponent<RestoreLogModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private restoreLogDataService: RestoreLogDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true
      }
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {}

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'actionStartDate',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_ACTION_START_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      }, {
        field: 'actionCompletionDate',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_ACTION_COMPLETION_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      }, {
        field: 'status',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.syncLogsStatus as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      }, {
        field: 'statusStep',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_STATUS_STEP',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.syncLogsStatusStep as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      }, {
        field: 'processed',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_PROCESSED',
        format: {
          type: (item: RestoreLogModel) => item.processedNo === undefined || item.totalNo === undefined ?
            '—' :
            `${item.processedNo} / ${item.totalNo}`
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY',
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'error',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_ERROR',
        sortable: true
      },
      {
        field: 'backupId',
        label: 'LNG_BACKUP_RESTORE_FIELD_LABEL_BACKUP_ID',
        sortable: true,
        format: {
          type: (item: RestoreLogModel) => `${item.backup?.date ? moment(item.backup.date).format(this.Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : ''} - ${item.backup?.location ? item.backup.location : ''} - ${item.backup?.description ? item.backup.description : '' }`
        }
      }
    ];
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
  protected initializeBreadcrumbs(): void {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // backups
    if (BackupModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_SYSTEM_BACKUPS_TITLE',
        action: {
          link: ['/system-config/backups']
        }
      });
    }

    // default
    this.breadcrumbs.push({
      label: 'LNG_PAGE_SYSTEM_BACKUPS_RESTORE_LIST',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'actionStartDate',
      'actionCompletionDate',
      'status',
      'statusStep',
      'processedNo',
      'totalNo',
      'createdBy',
      'backupId'
    ];
  }

  /**
   * Refresh list
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);

    // retrieve
    this.records$ = this.restoreLogDataService
      .getRestoreLogList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    this.restoreLogDataService
      .getRestoreLogListCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}
