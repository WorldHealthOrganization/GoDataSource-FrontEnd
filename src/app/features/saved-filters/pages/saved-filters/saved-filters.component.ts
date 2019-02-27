import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SavedFiltersService } from '../../../../core/services/data/saved-filters.service';
import * as _ from 'lodash';
import { SavedFilterModel } from '../../../../core/models/saved-filters.model';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-saved-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './saved-filters.component.html',
    styleUrls: ['./saved-filters.component.less']
})
export class SavedFiltersComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_FILTERS_TITLE', '.', true)
    ];

    authUser: UserModel;

    savedFiltersList$: Observable<SavedFilterModel[]>;
    savedFiltersListCount$: Observable<any>;

    constructor(
        private savedFiltersService: SavedFiltersService,
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService

    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
    }

    /**
     * Re(load) the Saved filters list, based on the applied filter, sort criterias
     */
    refreshList() {
        this.savedFiltersList$ = this.savedFiltersService.getSavedFiltersList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        this.savedFiltersListCount$ = this.savedFiltersService.getSavedFiltersListCount(countQueryBuilder).share();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'name',
            'public',
            'filter-keys'
        ];

        return columns;
    }

}
