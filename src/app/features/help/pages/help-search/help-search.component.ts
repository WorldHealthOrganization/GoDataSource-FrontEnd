import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { ActivatedRoute } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import * as _ from 'lodash';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-help-search',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './help-search.component.html',
    styleUrls: ['./help-search.component.less']
})
export class HelpSearchComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help', true)
    ];

    helpItemsList$: Observable<HelpItemModel[]>;

    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // provide constants to template
    Constants = Constants;

    searchedTerm: string = '';

    constructor(
        private helpDataService: HelpDataService,
        protected snackbarService: SnackbarService,
        protected listFilterDataService: ListFilterDataService,
        private route: ActivatedRoute
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
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
        this.queryBuilder.filter.where({approved: true}, true);
        // retrieve the list of items
        if (_.isEmpty(this.searchedTerm)) {
            this.queryBuilder.filter.remove('token');
            this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
        } else {
            this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this.searchedTerm);
        }

        this.helpItemsList$ = this.helpItemsList$
            .pipe(tap(this.checkEmptyList.bind(this)));
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
