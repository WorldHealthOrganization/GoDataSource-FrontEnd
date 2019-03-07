import { Component, OnInit } from '@angular/core';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs/Observable';
import { SavedImportMappingModel } from '../../../../core/models/saved-import-mapping.model';
import { tap } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
    selector: 'app-saved-import-mapping',
    templateUrl: './saved-import-mapping.component.html',
    styleUrls: ['./saved-import-mapping.component.less']
})
export class SavedImportMappingComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_TITLE', '.', true)
    ];

    savedImportMappingsList$: Observable<SavedImportMappingModel[]>;
    savedImportMappingsListCount$: Observable<any>;

    constructor(
        protected snackbarService: SnackbarService,
        private savedImportMappingService: SavedImportMappingService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // initialize pagination
        this.initPaginator();
        // ...and re-load the list
        this.needsRefreshList(true);
    }

    /**
     * Re(load) the Clusters list, based on the applied filter, sort criterias
     */
    refreshList() {
        this.savedImportMappingsList$ = this.savedImportMappingService.getSavedImportMappingsList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        this.savedImportMappingsListCount$ = this.savedImportMappingService.getSavedImportMappingsListCount(countQueryBuilder).share();
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

    getSavedImportMappingsList(){

    }

}
