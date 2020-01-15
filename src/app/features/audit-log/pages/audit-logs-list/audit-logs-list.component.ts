import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { AuditLogDataService } from '../../../../core/services/data/audit-log.data.service';
import { AuditLogModel } from '../../../../core/models/audit-log.model';
import { UserSettings } from '../../../../core/models/user.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';

@Component({
    selector: 'app-audit-logs-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './audit-logs-list.component.html',
    styleUrls: ['./audit-logs-list.component.less']
})
export class AuditLogsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_AUDIT_LOGS_TITLE', '.', true)
    ];

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
        private dialogService: DialogService,
        private auditLogDataService: AuditLogDataService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private userDataService: UserDataService
    ) {
        super(
            snackbarService
        );
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
        this.initializeSideTableColumns();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'action',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_ACTION'
            }),
            new VisibleColumnModel({
                field: 'recordId',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_ID'
            }),
            new VisibleColumnModel({
                field: 'modelName',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_MODEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_CREATED_AT'
            }),
            new VisibleColumnModel({
                field: 'changedData',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_CHANGE_DATA'
            }),
            new VisibleColumnModel({
                field: 'userId',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER'
            }),
            new VisibleColumnModel({
                field: 'userRole',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_USER_ROLES'
            }),
            new VisibleColumnModel({
                field: 'userIPAddress',
                label: 'LNG_AUDIT_LOG_FIELD_LABEL_IP_ADDRESS'
            })
        ];
    }

    /**
     * Re(load) the list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
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
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap(this.checkEmptyList.bind(this)),
                tap((data: any[]) => {
                    finishCallback(data);
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
                    this.snackbarService.showApiError(err);
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

