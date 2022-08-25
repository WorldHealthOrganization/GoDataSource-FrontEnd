import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { AuditLogModel } from '../../../../core/models/audit-log.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { AuditLogDataService } from '../../../../core/services/data/audit-log.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TranslateService } from '@ngx-translate/core';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import * as moment from 'moment';

@Component({
  selector: 'app-audit-logs-list',
  templateUrl: './audit-logs-list.component.html'
})
export class AuditLogsListComponent
  extends ListComponent<AuditLogModel>
  implements OnDestroy {
  // TODO: Left for changes tree feature inspiration
  // // date filter
  // dateFilterDefaultValue: {
  //   startDate,
  //   endDate
  // };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private auditLogDataService: AuditLogDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
   * Component initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
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
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'action',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_ACTION',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.auditLogAction as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      },
      {
        field: 'recordId',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'modelName',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: (item) => (this.activatedRoute.snapshot.data.auditLogModule as IResolverV2ResponseModel<ILabelValuePairModel>).map[item.modelName] ?
            this.translateService.instant((this.activatedRoute.snapshot.data.auditLogModule as IResolverV2ResponseModel<ILabelValuePairModel>).map[item.modelName].label) :
            item.modelName
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.auditLogModule as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_CREATED_AT',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'changedData',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA',
        // TODO: Needs changes tree feature,
        format: {
          type: () => '...'
        }
      },
      {
        field: 'userId',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER',
        format: {
          type: (item) => item.userId && this.activatedRoute.snapshot.data.user.map[item.userId] ?
            `${ this.activatedRoute.snapshot.data.user.map[item.userId].name }` :
            // TODO: Email not received from resolver
            //  ( ${ this.activatedRoute.snapshot.data.user.map[item.userId].email } )` :
            ''
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
          return data.userId ?
            `/users/${ data.userId }/view` :
            undefined;
        }
      },
      {
        field: 'userRole',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER_ROLES',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<UserRoleModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'userIPAddress',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_IP_ADDRESS',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
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
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => AuditLogModel.canExport(this.authUser),
      menuOptions: [
        // Export audit logs
        {
          label: {
            get: () => 'LNG_PAGE_LIST_AUDIT_LOGS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportAuditLogs(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return AuditLogModel.canExport(this.authUser);
          }
        }
      ]
    };
  }

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
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_AUDIT_LOGS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'action',
      'recordId',
      'modelName',
      'createdAt',
      'changedData',
      'userId',
      'userRole',
      'userIPAddress'
    ];
  }

  /**
   * Re(load) the list, based on the applied filter, sort criterias
   */
  refreshList() {
    // default sort by time descending
    if (this.queryBuilder.sort.isEmpty()) {
      this.queryBuilder.sort.by('createdAt', RequestSortDirection.DESC);
    }

    // retrieve the list of Audit Logs
    this.records$ = this.auditLogDataService
      .getAuditLogsList(this.queryBuilder)
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

    // remove paginator from query builder
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

    this.auditLogDataService
      .getAuditLogsCount(countQueryBuilder)
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


  /**
   * Export audit log data
   */
  private exportAuditLogs(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportData({
        title: {
          get: () => 'LNG_PAGE_LIST_AUDIT_LOGS_EXPORT_TITLE'
        },
        export: {
          url: '/audit-logs/export',
          async: true,
          method: ExportDataMethod.POST,
          fileName: `${ this.translateService.instant('LNG_PAGE_LIST_AUDIT_LOGS_TITLE') } - ${ moment().format('YYYY-MM-DD HH:mm') }`,
          queryBuilder: qb,
          allow: {
            types: [
              ExportDataExtension.JSON
            ],
            encrypt: true,
            dbColumns: true,
            dbValues: true,
            jsonReplaceUndefinedWithNull: true
          }
        }
      });
  }


  // TODO: Left for changes tree feature inspiration
  /**
   * Initialize header filters
   */
  // initializeHeaderFilters() {
  //   this.dateFilterDefaultValue = {
  //     startDate: moment().startOf('day').toISOString(),
  //     endDate: moment().endOf('day').toISOString()
  //   };
  //   this.queryBuilder.filter.byDateRange(
  //     'createdAt',
  //     this.dateFilterDefaultValue
  //   );
  // }

  // TODO: Left for changes tree feature inspiration
  /**
   * Add search criteria
   */
  // resetFiltersAddDefault() {
  //   this.initializeHeaderFilters();
  // }
}

