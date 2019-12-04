import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'app-help-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-categories-list.component.html',
    styleUrls: ['./help-categories-list.component.less']
})
export class HelpCategoriesListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of categories
    helpCategoriesList$: Observable<HelpCategoryModel[]>;
    helpCategoriesListCount$: Observable<any>;

    // provide constants to template
    Constants = Constants;

    recordActions: HoverRowAction[] = [
        // View Help Category
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_CATEGORY',
            click: (item: HelpCategoryModel) => {
                this.router.navigate(['/help', 'categories', item.id, 'view']);
            },
            visible: (item: HelpCategoryModel): boolean => {
                return !item.deleted;
            }
        }),

        // Modify Help Category
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_MODIFY_HELP_CATEGORY',
            click: (item: HelpCategoryModel) => {
                this.router.navigate(['/help', 'categories', item.id, 'modify']);
            },
            visible: (item: HelpCategoryModel): boolean => {
                return !item.deleted &&
                    this.hasHelpWriteAccess();
            }
        }),

        // View Help Items
        new HoverRowAction({
            icon: 'groupWork',
            iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_ITEMS_BUTTON',
            click: (item: HelpCategoryModel) => {
                this.router.navigate(['/help', 'categories', item.id, 'items']);
            },
            visible: (item: HelpCategoryModel): boolean => {
                return !item.deleted;
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Help Category
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_HELP_CATEGORY',
                    click: (item: HelpCategoryModel) => {
                        this.deleteHelpCategory(item);
                    },
                    visible: (item: HelpCategoryModel): boolean => {
                        return !item.deleted &&
                            this.hasHelpWriteAccess();
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private helpDataService: HelpDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private route: ActivatedRoute,
        private i18nService: I18nService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize pagination
        this.initPaginator();

        // ...and re-load the list
        this.needsRefreshList(true);

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
                field: 'name',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'order',
                label: 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER'
            })
        ];
    }

    /**
     * Re(load) the categories list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // retrieve the list of Categories
        this.helpCategoriesList$ = this.helpDataService
            .getHelpCategoryList(this.queryBuilder)
            .pipe(
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
        this.helpCategoriesListCount$ = this.helpDataService.getHelpCategoryCount(countQueryBuilder);
    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_HELP);
    }

    /**
     * Delete specific category
     * @param {HelpCategoryModel} category
     */
    deleteHelpCategory(category: HelpCategoryModel) {
        // show confirm dialog
        const translatedData = {name: this.i18nService.instant(category.name)};
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HELP_CATEGORY', translatedData)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.helpDataService
                        .deleteHelpCategory(category.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

}
