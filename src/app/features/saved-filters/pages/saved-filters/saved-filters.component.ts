import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { SavedFiltersService } from '../../../../core/services/data/saved-filters.data.service';
import * as _ from 'lodash';
import { SavedFilterModel } from '../../../../core/models/saved-filters.model';
import { catchError, share, tap } from 'rxjs/operators';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';

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

    yesNoOptionsList$: Observable<any[]>;

    pagesWithSavedFilters: LabelValuePair[] = _.map(Constants.APP_PAGE, (page) => {
        return new LabelValuePair(page.label, page.value);
    });

    savedFiltersList$: Observable<SavedFilterModel[]>;
    savedFiltersListCount$: Observable<any>;

    recordActions: HoverRowAction[] = [
        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Saved Filter
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_SAVED_FILTERS_ACTION_DELETE_FILTER',
                    click: (item: SavedFilterModel) => {
                        this.deleteFilter(item.id);
                    },
                    visible: (item: SavedFilterModel): boolean => {
                        return !item.readOnly;
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    constructor(
        private savedFiltersService: SavedFiltersService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {

        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list
        this.needsRefreshList(true);
    }

    /**
     * Re(load) the Saved filters list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        this.savedFiltersList$ = this.savedFiltersService
            .getSavedFiltersList(this.queryBuilder)
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
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.savedFiltersListCount$ = this.savedFiltersService.getSavedFiltersListCount(countQueryBuilder).pipe(share());
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'name',
            'public',
            'filter-keys'
        ];
    }

    /**
     * Set a saved filter public if it's created by the current user
     * @param savedFilterId
     * @param isPublic
     */
    setPublicItem(savedFilterId: string, isPublic: boolean) {
        this.savedFiltersService.modifyFilter(savedFilterId, {isPublic : isPublic})
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                this.snackbarService.showSuccess(`LNG_PAGE_LIST_SAVED_FILTERS_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE`);
            });
    }

    /**
     * Delete a saved filter
     * @param filterId
     */
    deleteFilter(filterId: string) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SAVED_FILTER')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.savedFiltersService.deleteFilter(filterId)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SAVED_FILTERS_ACTION_DELETE_FILTER_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
        });
    }

}
