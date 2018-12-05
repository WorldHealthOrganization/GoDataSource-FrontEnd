import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of entries grouped by category
    referenceData$: Observable<ReferenceDataCategoryModel[]>;

    referenceDataExporFileName: string = moment().format('YYYY-MM-DD');

    constructor(
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private authDataService: AuthDataService,
        private i18nService: I18nService
    ) {
        // load reference data
        this.referenceData$ = this.referenceDataDataService.getReferenceData();

        // add page title
        this.referenceDataExporFileName = this.i18nService.instant('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE') +
            ' - ' +
            this.referenceDataExporFileName;
    }

    /**
     * Component Initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'categoryName',
            'entries',
            'actions'
        ];
    }

    /**
     * Check if we have write access to reference data
     * @returns {boolean}
     */
    hasReferenceDataWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_REFERENCE_DATA);
    }
}
