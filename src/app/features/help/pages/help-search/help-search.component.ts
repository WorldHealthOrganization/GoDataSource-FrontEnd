import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { ActivatedRoute } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

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

    constructor(
        private helpDataService: HelpDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
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
        // retrieve the list of items
        this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {

    }

}
