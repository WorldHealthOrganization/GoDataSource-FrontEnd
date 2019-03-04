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
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';

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

    yesNoOptionsList$: Observable<any[]>;

    pagesWithSavedFilters: LabelValuePair[] = _.map(Constants.SAVED_FILTER_PAGE_TYPE, (page) => {
        return new LabelValuePair(page.label, page.value);
    });

    savedFiltersList$: Observable<SavedFilterModel[]>;
    savedFiltersListCount$: Observable<any>;

    constructor(
        private savedFiltersService: SavedFiltersService,
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

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
            'filter-keys',
            'actions'
        ];

        return columns;
    }

    /**
     * Set a saved filter public if it's created by the current user
     * @param savedFilterId
     * @param isPublic
     */
    setPublicItem(savedFilterId: string, isPublic: boolean) {
        this.savedFiltersService.modifySavedFilter(savedFilterId, {isPublic : isPublic})
            .catch((err) => {
                this.snackbarService.showApiError(err);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess(`LNG_PAGE_LIST_SAVED_FILTERS_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE`)
            });
    }

    /**
     * Delete a saved filter
     * @param filterId
     */
    deleteFilter(filterId: string) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_FILTER')
            .subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                this.savedFiltersService.deleteSavedFilter(filterId)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);

                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        this.snackbarService.showSuccess('LNG_PAGE_LIST_SAVED_FILTERS_ACTION_DELETE_FILTER_SUCCESS_MESSAGE');

                        // reload data
                        this.needsRefreshList(true);
                    });
            }
        });
    }

}
