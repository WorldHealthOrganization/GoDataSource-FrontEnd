import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import { IconModel } from '../../../../core/models/icon.model';
import { Observable } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import * as _ from 'lodash';

@Component({
    selector: 'app-manage-icons-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './manage-icons-list.component.html',
    styleUrls: ['./manage-icons-list.component.less']
})
export class ManageIconsListComponent extends ListComponent implements OnInit {
    // Breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // Category Name
    category: ReferenceDataCategoryModel;

    // constants
    IconModel = IconModel;

    // Icons
    iconsList$: Observable<IconModel[]>;
    iconsListCount$: Observable<IBasicCount>;

    // authenticated user
    authUser: UserModel;

    fixedTableColumns: string[] = [
        'name',
        'icon'
    ];

    recordActions: HoverRowAction[] = [
        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Icon
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_DELETE',
                    click: (item: IconModel) => {
                        this.deleteIcon(item);
                    },
                    visible: (item: IconModel): boolean => {
                        return IconModel.canDelete(this.authUser);
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
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private iconDataService: IconDataService,
        private dialogService: DialogService,
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the query params
        this.route.queryParams
            .subscribe((params: { categoryId }) => {
                // retrieve Reference Data Category info
                if (!params.categoryId) {
                    // update breadcrumbs
                    this.initializeBreadcrumbs();
                } else {
                    this.retrieveCategory(params.categoryId);
                }
            });

        // initialize pagination
        this.initPaginator();

        // retrieve icons
        this.needsRefreshList(true);
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ReferenceDataCategoryModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
            );
        }

        // add category
        if (
            this.category &&
            ReferenceDataEntryModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.category.name,
                    `/reference-data/${this.category.id}`,
                    false,
                    {},
                    this.category
                )
            );
        }

        // add manage icons breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_TITLE',
                '',
                true
            )
        );
    }

    /**
     * Retrieve category
     * @param categoryId
     */
    retrieveCategory(categoryId: string) {
        this.referenceDataDataService
            .getReferenceDataByCategory(categoryId)
            .subscribe((category: ReferenceDataCategoryModel) => {
                // set category
                this.category = category;

                // update breadcrumbs
                this.initializeBreadcrumbs();
            });
    }

    /**
     * Retrieve Icons
     */
    refreshList(finishCallback: (records: any[]) => void) {
        this.iconsList$ = this.iconDataService
            .getIconsList(this.queryBuilder)
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
        this.iconsListCount$ = this.iconDataService
            .getIconsCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    /**
     * Delete Icon
     * @param icon
     */
    deleteIcon(icon: IconModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ICON', icon)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete case
                    this.iconDataService
                        .deleteIcon(icon.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
