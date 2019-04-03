import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ActivatedRoute } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { tap } from 'rxjs/operators';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';

@Component({
    selector: 'app-help-items-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-items-list.component.html',
    styleUrls: ['./help-items-list.component.less']
})
export class HelpItemsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/categories', false)
    ];

    // authenticated user
    authUser: UserModel;
    categoryId: string;
    selectedCategory: HelpCategoryModel;

    helpItemsList$: Observable<HelpItemModel[]>;

    // provide constants to template
    Constants = Constants;

    constructor(
        private helpDataService: HelpDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private route: ActivatedRoute,
        private i18nService: I18nService,
        private cacheService: CacheService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params
            .subscribe((params: { categoryId }) => {
                this.categoryId = params.categoryId;
                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((category) => {
                        this.selectedCategory = category;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.selectedCategory.name,
                                `/help/categories/${this.categoryId}/view`,
                                false,
                                {},
                                {}
                            )
                        );
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
                                '.',
                                true,
                                {},
                                {}
                            )
                        );

                        // ...and re-load the list
                        this.needsRefreshList(true);
                        // initialize Side Table Columns
                        this.initializeSideTableColumns();
                    });

            });
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'title',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_TITLE'
            }),
            new VisibleColumnModel({
                field: 'comment',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_COMMENT'
            }),
            new VisibleColumnModel({
                field: 'approved',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED'
            }),
            new VisibleColumnModel({
                field: 'approvedBy',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_BY'
            }),
            new VisibleColumnModel({
                field: 'approvedDate',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_DATE'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Re(load) the items list
     */
    refreshList() {
        // retrieve the list of items
        this.helpItemsList$ = this.helpDataService.getHelpItemsCategoryList(this.categoryId, this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {

    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_HELP);
    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpApproveAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.APPROVE_HELP);
    }

    /**
     * Delete specific item
     * @param {HelpItemModel} item
     */
    deleteHelpItem(item: HelpItemModel) {
        // show confirm dialog
        const translatedData = {title: this.i18nService.instant(item.title)};
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HELP_ITEM', translatedData)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.helpDataService
                        .deleteHelpItem(item.categoryId, item.id)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // remove help items from cache
                            this.cacheService.remove(CacheKey.HELP_ITEMS);

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Approve specific item
     * @param {HelpItemModel} item
     */
    approveHelpItem(item: HelpItemModel) {
        // show confirm dialog
        const translatedData = {title: this.i18nService.instant(item.title)};
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_APPROVE_HELP_ITEM', translatedData)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.helpDataService
                        .approveHelpItem(item.categoryId, item.id)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_SUCCESS_MESSAGE');

                            // remove help items from cache
                            this.cacheService.remove(CacheKey.HELP_ITEMS);

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

}
