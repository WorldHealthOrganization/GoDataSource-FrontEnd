import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
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
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { RequestFilterOperator } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';

@Component({
    selector: 'app-help-search',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-search.component.html',
    styleUrls: ['./help-search.component.less']
})
export class HelpSearchComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help/categories', true)
    ];

    // authenticated user
    authUser: UserModel;

    helpItemsList$: Observable<HelpItemModel[]>;

    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // provide constants to template
    Constants = Constants;

    searchedTerm: string = '';

    constructor(
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

        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();

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
                field: 'title',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_TITLE'
            }),
            new VisibleColumnModel({
                field: 'categoryId',
                label: 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY'
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
        if (_.isEmpty(this.searchedTerm)) {
            this.queryBuilder.filter.where({approved: true});
            this.queryBuilder.filter.remove('$text');
            this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
        } else {
            // remove the approved property as it is not working together with the text search. The items should be filtered in the API.
            this.queryBuilder.filter.remove('approved');
            this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder);
        }
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
                            this.snackbarService.showApiError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_SUCCESS_MESSAGE');

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
                            this.snackbarService.showApiError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Filter the list by a text field
     * @param {string} value
     * @param {RequestFilterOperator} operator
     */
    filterByTextFieldHelpSearch(value: string) {
        this.queryBuilder.filter.where({$text: {search: value}}, true);
        // refresh list
        this.needsRefreshList();
    }

}
