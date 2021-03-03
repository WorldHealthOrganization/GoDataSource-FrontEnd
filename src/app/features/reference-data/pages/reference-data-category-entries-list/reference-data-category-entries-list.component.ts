import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { catchError, map, switchMap } from 'rxjs/operators';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { IconModel } from '../../../../core/models/icon.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-reference-data-category-entries-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-category-entries-list.component.html',
    styleUrls: ['./reference-data-category-entries-list.component.less']
})
export class ReferenceDataCategoryEntriesListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    categoryEntriesCount: IBasicCount;
    categoryEntries: ReferenceDataEntryModel[];
    categoryEntriesAll: ReferenceDataEntryModel[];
    categoryId: ReferenceDataCategory;

    category: ReferenceDataCategoryModel;

    // constants
    IconModel = IconModel;
    ReferenceDataEntryModel = ReferenceDataEntryModel;

    authUser: UserModel;

    UserSettings = UserSettings;

    recordActions: HoverRowAction[] = [
        // View Item
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_VIEW_ENTRY',
            linkGenerator: (item: ReferenceDataEntryModel): string[] => {
                return ['/reference-data', item.categoryId, item.id, 'view'];
            },
            visible: (): boolean => {
                return ReferenceDataEntryModel.canView(this.authUser);
            }
        }),

        // Modify Item
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_MODIFY_ENTRY',
            linkGenerator: (item: ReferenceDataEntryModel): string[] => {
                return ['/reference-data', item.categoryId, item.id, 'modify'];
            },
            visible: (): boolean => {
                return ReferenceDataEntryModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Item
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY',
                    click: (item: ReferenceDataEntryModel) => {
                        this.deleteEntry(item);
                    },
                    visible: (item: ReferenceDataEntryModel): boolean => {
                        return !item.readonly &&
                            ReferenceDataEntryModel.canDelete(this.authUser);
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
        private route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private i18nService: I18nService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the route params
        this.route.params
            .subscribe((params: { categoryId }) => {
                this.categoryId = params.categoryId;

                // initialize pagination
                this.initPaginator();

                // retrieve data
                this.needsRefreshList(true);

                // retrieve Reference Data Category info
                this.referenceDataDataService
                    .getReferenceDataByCategory(params.categoryId)
                    .subscribe((category: ReferenceDataCategoryModel) => {
                        // set data
                        this.category = category;

                        // update breadcrumbs
                        this.initializeBreadcrumbs();
                    });
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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

        // view / modify breadcrumb
        if (this.category) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.category.name,
                    '.',
                    true
                )
            );
        }
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'label',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE'
            }),
            new VisibleColumnModel({
                field: 'code',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'icon',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON'
            }),
            new VisibleColumnModel({
                field: 'color',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR'
            }),
            new VisibleColumnModel({
                field: 'order',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER'
            }),
            new VisibleColumnModel({
                field: 'active',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE'
            }),
            new VisibleColumnModel({
                field: 'readonly',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_SYSTEM_VALUE'
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        ];
    }

    refreshList(finishCallback: (records: any[]) => void) {
        this.categoryEntriesAll = [];
        this.categoryEntries = [];
        if (this.categoryId) {
            this.referenceDataDataService
                .getReferenceDataByCategory(this.categoryId)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    map((category: ReferenceDataCategoryModel) => {
                        return category.entries;
                    })
                )
                .subscribe((entries) => {
                    // retrieve all entries
                    this.categoryEntriesAll = entries ? entries : [];

                    // display only items from this page
                    if (this.queryBuilder.paginator) {
                        this.categoryEntries = this.categoryEntriesAll.slice(
                            this.queryBuilder.paginator.skip,
                            this.queryBuilder.paginator.skip + this.queryBuilder.paginator.limit
                        );
                    }

                    // refresh the total count
                    this.refreshListCount();

                    // flag if list is empty
                    this.checkEmptyList(this.categoryEntries);

                    // finished
                    finishCallback(entries);
                });
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items
     */
    refreshListCount() {
        this.categoryEntriesCount = {
            count: this.categoryEntriesAll ?
                this.categoryEntriesAll.length :
                0
        };
    }

    /**
     * Delete ref data entry
     */
    deleteEntry(entry: ReferenceDataEntryModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_REFERENCE_DATA_ENTRY')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete entry
                    this.referenceDataDataService
                        .deleteEntry(entry.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err, {entryValue: entry.value});
                                return throwError(err);
                            }),
                            switchMap(() => {
                                // re-load language tokens
                                return this.i18nService.loadUserLanguage();
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Change Reference entry item order value
     */
    changeRefEntryOrder(
        refEntry: ReferenceDataEntryModel,
        order: any
    ) {
        // convert string to number
        order = order && _.isString(order) ? parseFloat(order) : order;

        // modify reference entry item
        this.referenceDataDataService
            .modifyEntry(
                refEntry.id, {
                    order: order ? order : null
                }
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                // update loaded ref data
                refEntry.order = order ? order : null;

                // show success ?
                // this might not be the best idea...maybe we can replace / remove it
                this.snackbarService.showSuccess('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_CHANGE_ORDER_SUCCESS_MESSAGE');
            });
    }
}
