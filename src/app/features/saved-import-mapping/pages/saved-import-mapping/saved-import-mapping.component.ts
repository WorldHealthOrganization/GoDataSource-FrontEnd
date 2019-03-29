import { Component, OnInit } from '@angular/core';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { SavedImportMappingModel } from '../../../../core/models/saved-import-mapping.model';
import { tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-saved-import-mapping',
    templateUrl: './saved-import-mapping.component.html',
    styleUrls: ['./saved-import-mapping.component.less']
})
export class SavedImportMappingComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_TITLE', '.', true)
    ];

    yesNoOptionsList$: Observable<any[]>;

    pagesWithSavedFilters: LabelValuePair[] = _.map(Constants.APP_IMPORT_PAGE, (page) => {
        return new LabelValuePair(page.label, page.value);
    });

    savedImportMappingsList$: Observable<SavedImportMappingModel[]>;
    savedImportMappingsListCount$: Observable<any>;

    constructor(
        protected snackbarService: SnackbarService,
        private savedImportMappingService: SavedImportMappingService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService
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
     * Re(load) the Clusters list, based on the applied filter, sort criterias
     */
    refreshList() {
        this.savedImportMappingsList$ = this.savedImportMappingService.getImportMappingsList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        this.savedImportMappingsListCount$ = this.savedImportMappingService.getImportMappingsListCount(countQueryBuilder).share();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'name',
            'isPublic',
            'mappingKey',
            'actions'
        ];

        return columns;
    }

    /**
     * Delete a saved import mapping
     * @param {string} savedImportId
     */
    deleteImportMapping(savedImportId: string) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SAVED_IMPORT_MAPPING')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.savedImportMappingService.deleteImportMapping(savedImportId)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Modify public status of a saved import mapping
     * @param {string} savedImportMappingId
     * @param {boolean} isPublic
     */
    setPublicItem(savedImportMappingId: string, isPublic: boolean) {
        this.savedImportMappingService.modifyImportMapping(savedImportMappingId, {isPublic : isPublic})
            .catch((err) => {
                this.snackbarService.showApiError(err);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess(`LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE`);
            });
    }

}
