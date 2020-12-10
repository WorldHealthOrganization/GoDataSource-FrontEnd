import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, throwError } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { CotSnapshotModel } from '../../../../core/models/cot-snapshot.model';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { Constants } from 'app/core/models/constants';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-transmission-chains-snapshot-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-snapshot-list.component.html',
    styleUrls: ['./transmission-chains-snapshot-list.component.less']
})
export class TransmissionChainsSnapshotListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', '/transmission-chains', false),
        new BreadcrumbItemModel('LNG_PAGE_LIST_ASYNC_COT_TITLE', null, true)
    ];

    // constants
    UserSettings = UserSettings;
    Constants = Constants;

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

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
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
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
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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
        this.initializeSideTableColumns();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();

        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_ASYNC_COT_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'startDate',
                label: 'LNG_ASYNC_COT_FIELD_LABEL_START_DATE'
            }),
            new VisibleColumnModel({
                field: 'endDate',
                label: 'LNG_ASYNC_COT_FIELD_LABEL_END_DATE'
            }),
            new VisibleColumnModel({
                field: 'status',
                label: 'LNG_ASYNC_COT_FIELD_LABEL_STATUS'
            }),
            new VisibleColumnModel({
                field: 'error',
                label: 'LNG_ASYNC_COT_FIELD_LABEL_ERROR'
            })
        ];
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // we need the outbreak to continue
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            finishCallback([]);
            return;
        }

        // default sort order ?
        if (this.queryBuilder.sort.isEmpty()) {
            this.queryBuilder.sort.by(
                'startDate',
                RequestSortDirection.DESC
            );
        }

        // retrieve only snapshots from this user ?
        // #TODO

        // retrieve the list of Cases
        this.cotSnapshotsList$ = this.transmissionChainDataService
            .getSnapshotsList(
                this.selectedOutbreak.id,
                this.queryBuilder
            )
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
                    this.snackbarService.showApiError(err);
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
                    // delete case
                    this.transmissionChainDataService
                        .deleteSnapshot(
                            this.selectedOutbreak.id,
                            cotSnapshotModel.id
                        )
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // show message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ASYNC_COT_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
