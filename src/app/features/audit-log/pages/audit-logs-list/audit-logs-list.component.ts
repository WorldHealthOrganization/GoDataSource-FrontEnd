import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { AuditLogDataService } from '../../../../core/services/data/audit-log.data.service';
import { AuditLogModel } from '../../../../core/models/audit-log.model';
import { UserSettings } from '../../../../core/models/user.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { catchError, share } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-audit-logs-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './audit-logs-list.component.html',
  styleUrls: ['./audit-logs-list.component.less']
})
export class AuditLogsListComponent
  extends ListComponent
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_AUDIT_LOGS_TITLE', '.', true)
  // ];

  // list of existing audit logs
  auditLogsList$: Observable<AuditLogModel[]>;
  auditLogsListCount$: Observable<IBasicCount>;

  // options
  usersList$: Observable<any>;
  auditLogActionsList$: Observable<any>;
  dataModuleList: LabelValuePair[];
  dataModuleMapped: {
    [module: string]: string
  };

  // date filter
  dateFilterDefaultValue: {
    startDate,
    endDate
  };

  // constants
  UserSettings = UserSettings;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private auditLogDataService: AuditLogDataService,
    private toastV2Service: ToastV2Service,
    private genericDataService: GenericDataService,
    private userDataService: UserDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // set default filter rules
    this.initializeHeaderFilters();

    // initialize pagination
    this.initPaginator();
    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);

    // construct user sort criteria
    const usersFilter = new RequestQueryBuilder();
    usersFilter.sort
      .by('firstName', RequestSortDirection.ASC)
      .by('lastName', RequestSortDirection.ASC);

    // initialize dropdown options
    this.usersList$ = this.userDataService.getUsersList(usersFilter);
    this.auditLogActionsList$ = this.genericDataService.getAuditLogActionOptions();

    // data modules
    this.genericDataService
      .getDataModuleOptions()
      .subscribe((data) => {
        // data module
        this.dataModuleList = data;

        // map for easy access
        this.dataModuleMapped = _.transform(
          data,
          (result, value: LabelValuePair) => {
            result[value.value] = value.label;
          }
        ) as any;
      });

    // initialize Side Table Columns
    this.initializeTableColumns();
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
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'action',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_ACTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'recordId',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'modelName',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_CREATED_AT'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'changedData',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'userId',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'userRole',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER_ROLES'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'userIPAddress',
    //     label: 'LNG_AUDIT_LOG_FIELD_LABEL_IP_ADDRESS'
    //   })
    // ];
  }

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
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the list, based on the applied filter, sort criterias
   */
  refreshList() {
    // include user details
    this.queryBuilder.include('user', true);

    // default sort by time descending
    if (this.queryBuilder.sort.isEmpty()) {
      this.queryBuilder.sort.by('createdAt', RequestSortDirection.DESC);
    }

    // retrieve the list of Audit Logs
    this.auditLogsList$ = this.auditLogDataService
      .getAuditLogsList(this.queryBuilder)
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
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.auditLogsListCount$ = this.auditLogDataService
      .getAuditLogsCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

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

  /**
     * Add search criteria
     */
  resetFiltersAddDefault() {
    this.initializeHeaderFilters();
  }
}

