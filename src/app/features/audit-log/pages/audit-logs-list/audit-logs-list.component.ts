import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { AuditLogChangeDataModel, AuditLogModel } from '../../../../core/models/audit-log.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { AuditLogDataService } from '../../../../core/services/data/audit-log.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2ColumnPinned, V2ColumnExpandRowType, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TranslateService } from '@ngx-translate/core';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { Constants } from '../../../../core/models/constants';
import { ChangeValue, ChangeValueArray, ChangeValueObject, ChangeValueType } from '../../../../shared/components-v2/app-changes-v2/models/change.model';
import * as momentOriginal from 'moment';
import { moment } from '../../../../core/helperClasses/x-moment';

@Component({
  selector: 'app-audit-logs-list',
  templateUrl: './audit-logs-list.component.html'
})
export class AuditLogsListComponent
  extends ListComponent<AuditLogModel>
  implements OnDestroy {

  // audit-log fields
  private auditLogFields: ILabelValuePairModel[] = [
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_ACTION', value: 'action' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_NAME', value: 'modelName' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_ID', value: 'recordId' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA', value: 'changedData' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER', value: 'user' },
    { label: 'LNG_AUDIT_LOG_FIELD_LABEL_IP_ADDRESS', value: 'userIPAddress' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

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
          type: V2FilterType.DATE_RANGE,
          value: {
            startDate: moment().subtract(7, 'days').startOf('day'),
            endDate: moment().endOf('day')
          },
          defaultValue: {
            startDate: moment().subtract(7, 'days').startOf('day'),
            endDate: moment().endOf('day')
          }
        }
      },
      {
        field: 'changedData',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA',
        format: {
          type: V2ColumnFormat.EXPAND_ROW
        },
        column: {
          type: V2ColumnExpandRowType.CHANGES,
          changes: (auditLog: AuditLogModel) => {
            // must process audit log ?
            if (!auditLog.uiChangeValue) {
              auditLog.uiChangeValue = auditLog.changedData
                .map((log) => this.determineChanges(
                  log,
                  auditLog.modelName
                ))
                .filter((value) => value !== null);
            }

            // finished
            return auditLog.uiChangeValue;
          }
        }
      },
      {
        field: 'userId',
        label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER',
        format: {
          type: (item) => item.userId && this.activatedRoute.snapshot.data.user.map[item.userId] ?
            `${ this.activatedRoute.snapshot.data.user.map[item.userId].name } ( ${ this.activatedRoute.snapshot.data.user.map[item.userId].email } )` :
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
          return data.userId && UserModel.canView(this.authUser) ?
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
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => AuditLogModel.canExport(this.authUser),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_AUDIT_LOGS_GROUP_ACTION_EXPORT_SELECTED_AUDIT_LOGS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect(
                'id',
                selected,
                true,
                null
              );

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = { ...this.queryBuilder.sort.criterias };
              }

              // export
              this.exportAuditLogs(qb);
            }
          },
          visible: (): boolean => {
            return AuditLogModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        }
      ]
    };
  }

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
          fileName: `${ this.translateService.instant('LNG_PAGE_LIST_AUDIT_LOGS_TITLE') } - ${ momentOriginal().format('YYYY-MM-DD HH:mm') }`,
          queryBuilder: qb,
          allow: {
            types: [
              ExportDataExtension.JSON
            ],
            anonymize: {
              fields: this.auditLogFields
            },
            fields: {
              options: this.auditLogFields
            },
            dbColumns: true,
            dbValues: true,
            jsonReplaceUndefinedWithNull: true
          }
        }
      });
  }

  /**
   * Determine audit log changes
   */
  private determineChanges(
    changedData: AuditLogChangeDataModel,
    modelName: string
  ): ChangeValue | null {
    // get changed value data type
    const changedValueType: ChangeValueType = this.determineChangesType(
      changedData,
      modelName
    );

    // get changed value in proper format for being displayed in UI
    switch (changedValueType) {
      // boolean, number, string, token, date
      case ChangeValueType.BOOLEAN:
      case ChangeValueType.NUMBER:
      case ChangeValueType.STRING:
      case ChangeValueType.LNG_TOKEN:
      case ChangeValueType.DATE:
        if (
          // omit empty values
          (
            (
              changedData.newValue === undefined ||
              changedData.newValue === null ||
              changedData.newValue === ''
            ) &&
            (
              changedData.oldValue === undefined ||
              changedData.oldValue === null ||
              changedData.oldValue === ''
            )
          ) ||
          // omit identical values
          (changedData.newValue === changedData.oldValue)
        ) {
          return null;
        }

        // finished
        return {
          type: changedValueType,
          value: {
            property: changedData.field,
            newValue: changedData.newValue,
            oldValue: changedData.oldValue
          }
        };

      // rich content
      case ChangeValueType.RICH_CONTENT:
        return {
          type: changedValueType,
          property: changedData.field
        };

      // object, array
      case ChangeValueType.OBJECT:
      case ChangeValueType.ARRAY:
        // value
        const fieldValue: ChangeValueObject | ChangeValueArray = {
          type: changedValueType,
          rootProperty: changedData.field,
          value: []
        };

        // add all child properties and their changed values
        const alreadyProcessed: {
          [prop: string]: true
        } = {};

        // collect properties from 'newValue'
        this.processChangeValue(
          fieldValue,
          changedData,
          modelName,
          alreadyProcessed,
          changedData.newValue
        );

        // collect properties from 'oldValue'
        this.processChangeValue(
          fieldValue,
          changedData,
          modelName,
          alreadyProcessed,
          changedData.oldValue
        );

        // did we collect any properties?
        if (fieldValue.value.length === 0) {
          return null;
        }

        // finished
        return fieldValue;
    }

    return null;
  }

  /**
   * Determine audit log changes type
   */
  private determineChangesType(
    changedData: AuditLogChangeDataModel,
    modelName: string
  ): ChangeValueType {
    // get data type based on newValue or oldValue (if newValue is empty)
    let relevantValue = changedData.newValue;
    if (
      changedData.newValue === undefined ||
      changedData.newValue === null ||
      changedData.newValue === ''
    ) {
      relevantValue = changedData.oldValue;
    }

    // string ?
    if (typeof relevantValue === 'string') {

      // do not translate fields: 'id', 'token'
      if (
        changedData.field === 'id' ||
        changedData.field === 'token'
      ) {
        return ChangeValueType.STRING;
      }

      // do not try to display rich content
      if (
        (
          modelName === Constants.DATA_MODULES.HELP_ITEM.value &&
          (
            changedData.field === 'content' ||
            changedData.field === 'translation'
          )
        ) || (
          modelName === Constants.DATA_MODULES.LANGUAGE_TOKEN.value &&
          changedData.field === 'translation'
        )
      ) {
        return ChangeValueType.RICH_CONTENT;
      }

      // language token?
      if (relevantValue.startsWith('LNG_')) {
        return ChangeValueType.LNG_TOKEN;
      }

      // date?
      if (new Date(relevantValue).getTime() > 0) {
        return ChangeValueType.DATE;
      }

      // default
      return ChangeValueType.STRING;
    }

    // boolean ?
    if (typeof relevantValue === 'boolean') {
      return ChangeValueType.BOOLEAN;
    }

    // number ?
    if (typeof relevantValue === 'number') {
      return ChangeValueType.NUMBER;
    }

    // array
    if (Array.isArray(relevantValue)) {
      return ChangeValueType.ARRAY;
    }

    // object
    if (typeof relevantValue === 'object') {
      return ChangeValueType.OBJECT;
    }
  }

  /**
   * Process object / array values
   */
  private processChangeValue(
    fieldValue: ChangeValueObject | ChangeValueArray,
    parentValue: AuditLogChangeDataModel,
    modelName: string,
    alreadyProcessed: {
      [prop: string]: true
    },
    valueObject: any
  ) {
    for (const prop in valueObject) {
      // process only if not already processed
      if (!alreadyProcessed[prop]) {
        // mark as processed
        alreadyProcessed[prop] = true;

        // process
        const propFieldValue = this.determineChanges(
          new AuditLogChangeDataModel({
            field: prop,
            newValue: _.get(parentValue.newValue, prop, ''),
            oldValue: _.get(parentValue.oldValue, prop, '')
          }),
          modelName
        );

        // add value to the list of not empty
        if (propFieldValue) {
          fieldValue.value.push(propFieldValue);
        }
      }
    }
  }
}

