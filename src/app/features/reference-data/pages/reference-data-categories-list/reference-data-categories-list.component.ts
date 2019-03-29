import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of entries grouped by category
    referenceData$: Observable<ReferenceDataCategoryModel[]>;

    referenceDataExporFileName: string = moment().format('YYYY-MM-DD');

    loadingDialog: LoadingDialogModel;

    constructor(
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        protected snackbarService: SnackbarService
    ) {
        super(snackbarService);

        this.refreshList();

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
     * Re(load) the Reference Data Categories list
     */
    refreshList() {
        // load reference data
        this.referenceData$ = this.referenceDataDataService.getReferenceData();
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

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
