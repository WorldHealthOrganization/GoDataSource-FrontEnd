import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { Router } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import * as _ from 'lodash';
import { catchError, tap } from 'rxjs/operators';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { HoverRowAction } from '../../../../shared/components';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-help-search',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-search.component.html',
    styleUrls: ['./help-search.component.less']
})
export class HelpSearchComponent extends ListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help', true)
    ];

    // authenticated user
    authUser: UserModel;

    helpItemsList$: Observable<HelpItemModel[]>;

    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // provide constants to template
    Constants = Constants;
    HelpCategoryModel = HelpCategoryModel;

    searchedTerm: string = '';

    recordActions: HoverRowAction[] = [
        // View Help Item
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_GLOBAL_HELP_ACTION_VIEW_HELP_ITEM',
            click: (item: HelpItemModel) => {
                this.router.navigate(['/help', 'categories', item.categoryId, 'items', item.id, 'view-global']);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private authDataService: AuthDataService,
        private helpDataService: HelpDataService,
        private snackbarService: SnackbarService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
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
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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
            })
        ];
    }

    /**
     * Re(load) the items list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        this.queryBuilder.filter.where({approved: true}, true);
        // retrieve the list of items
        if (_.isEmpty(this.searchedTerm)) {
            this.queryBuilder.filter.remove('token');
            this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
        } else {
            this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this.searchedTerm);
        }

        this.helpItemsList$ = this.helpItemsList$
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
     * Filter the list by a text field
     * @param {string} value
     */
    filterByTextFieldHelpSearch(value: string) {
        this.searchedTerm = value;

        // refresh list
        this.needsRefreshList();
    }
}
