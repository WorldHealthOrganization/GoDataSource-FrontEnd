import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AuditLogModel } from '../../../../core/models/audit-log.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { AuditLogDataService } from '../../../../core/services/data/audit-log.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-audit-logs-list',
  templateUrl: './audit-logs-list.component.html'
})
export class AuditLogsListComponent
  extends ListComponent<AuditLogModel>
  implements OnDestroy {
  // TODO: Left for changes tree feature inspiration
  // date filter
  dateFilterDefaultValue: {
    startDate,
    endDate
  };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private auditLogDataService: AuditLogDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute
  ) {
    super(listHelperService);

    // TODO: Left for auditLogAction resolver inspiration
    // initialize dropdown options
    // this.auditLogActionsList$ = this.genericDataService.getAuditLogActionOptions();

    // TODO: Left for moduleOption resolver inspiration
    // // data modules
    // this.genericDataService
    //   .getDataModuleOptions()
    //   .subscribe((data) => {
    //     // data module
    //     this.dataModuleList = data;

    //     // map for easy access
    //     this.dataModuleMapped = _.transform(
    //       data,
    //       (result, value: LabelValuePair) => {
    //         result[value.value] = value.label;
    //       }
    //     ) as any;
    //   });
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
        sortable: true,
        pinned: IV2ColumnPinned.LEFT
        // TODO: Needs auditLogAction resolver
        // filter: {
        //   type: V2FilterType.MULTIPLE_SELECT,
        //   options: (this.activatedRoute.snapshot.data.auditLogAction as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        // }
      },
      {
        field: 'recordId',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_ID',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'modelName',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_NAME',
        sortable: true
        // TODO: Needs moduleOption resolver
        // filter: {
        //   type: V2FilterType.MULTIPLE_SELECT,
        //   options: (this.activatedRoute.snapshot.data.moduleOption as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        // }
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
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA'
        // TODO: Needs changes tree feature
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

  // TODO: Left for changes tree feature inspiration
  /**
   * Initialize header filters
   */
  initializeHeaderFilters() {
    this.dateFilterDefaultValue = {
      startDate: moment().startOf('day').toISOString(),
      endDate: moment().endOf('day').toISOString()
    };
    this.queryBuilder.filter.byDateRange(
      'createdAt',
      this.dateFilterDefaultValue
    );
  }

  // TODO: Left for changes tree feature inspiration
  /**
   * Add search criteria
   */
  resetFiltersAddDefault() {
    this.initializeHeaderFilters();
  }
}

