import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../../../../core/services/helper/model-helper.service';

@Component({
    selector: 'app-saved-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './saved-filters.component.html',
    styleUrls: ['./saved-filters.component.less']
})
export class SavedFiltersComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_FILTERS_TITLE', '.', true)
    ];

    savedFiltersListCount$: Observable<any>;


    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {

    }

}
